from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any, List, Optional, Union

from fastapi import HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Album,
    Artist,
    Follow,
    LikedTrack,
    PlaybackState,
    Playlist,
    PlaylistTrack,
    RecentlyPlayed,
    SavedAlbum,
    SavedArtist,
    Track,
    User,
)
from app.schemas import (
    AlbumOut,
    ArtistOut,
    BrowseHomeOut,
    BrowseSectionOut,
    PlaybackStateOut,
    PublicUser,
    TrackOut,
    UserProfile,
)

VISIBLE_TAMIL_TRACK_TITLES = [
    "Rowdy Baby",
    "Vaathi Coming",
    "Why This Kolaveri Di",
    "Enjoy Enjaami",
    "Arabic Kuthu",
    "Munbe Vaa",
    "Vaseegara",
    "Megham Karukatha",
    "Naatu Naatu (Tamil Version)",
    "Oo Antava (Tamil Version)",
]


def ensure_playback_state(db: Session, user: User) -> PlaybackState:
    state = db.scalar(select(PlaybackState).where(PlaybackState.user_id == user.id))
    if state is None:
        state = PlaybackState(user_id=user.id, queue_track_ids="[]")
        db.add(state)
        db.commit()
        db.refresh(state)
    return state


def ensure_starter_library(db: Session, user: User) -> None:
    has_likes = (
        db.scalar(
            select(func.count())
            .select_from(LikedTrack)
            .join(Track, Track.id == LikedTrack.track_id)
            .where(LikedTrack.user_id == user.id, Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))
        )
        or 0
    )
    has_saved_albums = (
        db.scalar(
            select(func.count())
            .select_from(SavedAlbum)
            .join(Album, Album.id == SavedAlbum.album_id)
            .join(Track, Track.album_id == Album.id)
            .where(SavedAlbum.user_id == user.id, Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))
        )
        or 0
    )
    has_saved_artists = (
        db.scalar(
            select(func.count())
            .select_from(SavedArtist)
            .join(Artist, Artist.id == SavedArtist.artist_id)
            .join(Track, Track.artist_id == Artist.id)
            .where(SavedArtist.user_id == user.id, Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))
        )
        or 0
    )

    if has_likes and has_saved_albums and has_saved_artists:
        return

    starter_tracks = list(db.scalars(tamil_track_query().order_by(Track.id.desc()).limit(3)).unique())
    starter_albums = []
    starter_artists = []
    for track in starter_tracks:
        if track.album and all(existing.id != track.album.id for existing in starter_albums):
            starter_albums.append(track.album)
        if track.artist and all(existing.id != track.artist.id for existing in starter_artists):
            starter_artists.append(track.artist)

    starter_albums = starter_albums[:2]
    starter_artists = starter_artists[:2]

    if not has_likes:
        for track in starter_tracks:
            existing = db.scalar(
                select(LikedTrack).where(LikedTrack.user_id == user.id, LikedTrack.track_id == track.id)
            )
            if existing is None:
                db.add(LikedTrack(user_id=user.id, track_id=track.id))

    if not has_saved_albums:
        for album in starter_albums:
            existing = db.scalar(
                select(SavedAlbum).where(SavedAlbum.user_id == user.id, SavedAlbum.album_id == album.id)
            )
            if existing is None:
                db.add(SavedAlbum(user_id=user.id, album_id=album.id))

    if not has_saved_artists:
        for artist in starter_artists:
            existing = db.scalar(
                select(SavedArtist).where(SavedArtist.user_id == user.id, SavedArtist.artist_id == artist.id)
            )
            if existing is None:
                db.add(SavedArtist(user_id=user.id, artist_id=artist.id))

    db.commit()


def ensure_starter_playlists(db: Session, user: User) -> None:
    existing = db.scalar(select(func.count()).select_from(Playlist).where(Playlist.owner_id == user.id)) or 0
    if existing:
        return

    tracks = list(db.scalars(tamil_track_query().order_by(Track.id.asc())).unique())
    if len(tracks) < 6:
        return

    starter_playlists = [
        Playlist(
            owner_id=user.id,
            title="Tamil Hit Mix",
            description="Starter playlist with chart Tamil favorites.",
            is_public=True,
            cover_image=tracks[0].album.cover_image,
        ),
        Playlist(
            owner_id=user.id,
            title="Evening Tamil Vibes",
            description="A softer playlist built from the Tamil starter catalog.",
            is_public=False,
            cover_image=tracks[5].album.cover_image,
        ),
    ]

    for playlist in starter_playlists:
        db.add(playlist)
    db.flush()

    playlist_tracks = [
        (starter_playlists[0], tracks[:5]),
        (starter_playlists[1], tracks[5:10]),
    ]
    for playlist, playlist_items in playlist_tracks:
        for index, track in enumerate(playlist_items, start=1):
            db.add(PlaylistTrack(playlist_id=playlist.id, track_id=track.id, position=index))

    db.commit()


def track_query() -> Select[tuple[Track]]:
    return select(Track).options(joinedload(Track.artist), joinedload(Track.album).joinedload(Album.artist))


def tamil_track_query() -> Select[tuple[Track]]:
    return track_query().where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))


def get_track_or_404(db: Session, track_id: int) -> Track:
    track = db.scalar(track_query().where(Track.id == track_id))
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    return track


def get_playlist_or_404(db: Session, playlist_id: int) -> Playlist:
    playlist = db.scalar(
        select(Playlist)
        .options(
            joinedload(Playlist.owner),
            joinedload(Playlist.tracks).joinedload(PlaylistTrack.track).joinedload(Track.artist),
            joinedload(Playlist.tracks).joinedload(PlaylistTrack.track).joinedload(Track.album).joinedload(Album.artist),
        )
        .where(Playlist.id == playlist_id)
    )
    if playlist is None:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist


def serialize_playback_state(db: Session, state: PlaybackState) -> PlaybackStateOut:
    queue_track_ids = json.loads(state.queue_track_ids or "[]")
    current_track = None
    if state.current_track_id is not None:
        current_track = get_track_or_404(db, state.current_track_id)
    return PlaybackStateOut(
        current_track=TrackOut.model_validate(current_track) if current_track else None,
        is_playing=state.is_playing,
        position_seconds=state.position_seconds,
        volume=state.volume,
        shuffle_enabled=state.shuffle_enabled,
        repeat_mode=state.repeat_mode,
        queue_track_ids=queue_track_ids,
    )


def add_recently_played(db: Session, user_id: int, track_id: int) -> None:
    db.add(RecentlyPlayed(user_id=user_id, track_id=track_id))
    db.commit()


def ensure_queue(state: PlaybackState, fallback_track_id: Optional[int] = None) -> List[int]:
    queue = json.loads(state.queue_track_ids or "[]")
    if not queue and fallback_track_id is not None:
        queue = [fallback_track_id]
    return queue


def update_queue(state: PlaybackState, queue_track_ids: List[int]) -> None:
    state.queue_track_ids = json.dumps(queue_track_ids)


def advance_queue(db: Session, state: PlaybackState, step: int) -> PlaybackState:
    queue = ensure_queue(state, state.current_track_id)
    if not queue:
        raise HTTPException(status_code=400, detail="Playback queue is empty")

    if state.repeat_mode == "one" and state.current_track_id is not None:
        state.position_seconds = 0
        state.is_playing = True
        db.commit()
        return state

    if state.shuffle_enabled and len(queue) > 1:
        candidates = [track_id for track_id in queue if track_id != state.current_track_id]
        next_track_id = random.choice(candidates or queue)
    else:
        current_index = queue.index(state.current_track_id) if state.current_track_id in queue else 0
        target_index = current_index + step
        if target_index >= len(queue):
            if state.repeat_mode == "all":
                target_index = 0
            else:
                state.is_playing = False
                db.commit()
                return state
        elif target_index < 0:
            target_index = len(queue) - 1
        next_track_id = queue[target_index]

    state.current_track_id = next_track_id
    state.position_seconds = 0
    state.is_playing = True
    db.commit()
    return state


def user_profile(db: Session, user: User) -> UserProfile:
    follower_count = db.scalar(select(func.count()).select_from(Follow).where(Follow.following_id == user.id)) or 0
    following_count = db.scalar(select(func.count()).select_from(Follow).where(Follow.follower_id == user.id)) or 0
    base = PublicUser.model_validate(user).model_dump()
    return UserProfile(**base, follower_count=follower_count, following_count=following_count)


def greeting_for_hour(hour: int) -> str:
    if hour < 12:
        return "Good morning"
    if hour < 18:
        return "Good afternoon"
    return "Good evening"


def recommended_tracks_for_user(db: Session, user: User, limit: int = 8) -> List[Track]:
    liked_or_recent = db.scalars(
        select(Track)
        .join(LikedTrack, LikedTrack.track_id == Track.id, isouter=True)
        .join(RecentlyPlayed, RecentlyPlayed.track_id == Track.id, isouter=True)
        .where(
            or_(
                LikedTrack.user_id == user.id,
                RecentlyPlayed.user_id == user.id,
            )
        )
        .options(joinedload(Track.artist), joinedload(Track.album).joinedload(Album.artist))
    ).unique()

    preferred_genres: List[str] = []
    for track in liked_or_recent:
        genre = track.genre or track.album.genre or track.artist.genre
        if genre and genre not in preferred_genres:
            preferred_genres.append(genre)

    stmt = tamil_track_query()
    if preferred_genres:
        stmt = stmt.where(Track.genre.in_(preferred_genres))

    tracks = list(db.scalars(stmt.order_by(Track.created_at.desc()).limit(limit * 2)).unique())
    if len(tracks) < limit:
        fallback = list(db.scalars(tamil_track_query().order_by(Track.created_at.desc()).limit(limit)).unique())
        seen_ids = {track.id for track in tracks}
        tracks.extend(track for track in fallback if track.id not in seen_ids)
    return tracks[:limit]


def build_browse_home(db: Session, user: User, hour: int) -> BrowseHomeOut:
    all_tracks = list(db.scalars(tamil_track_query().order_by(Track.created_at.desc()).limit(10)).unique())
    featured_ids = {track.id for track in all_tracks[:6]}
    recommended = [track for track in recommended_tracks_for_user(db, user, limit=10) if track.id not in featured_ids][:8]
    recent_tracks = list(
        db.scalars(
            track_query()
            .join(RecentlyPlayed, RecentlyPlayed.track_id == Track.id)
            .where(RecentlyPlayed.user_id == user.id)
            .where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))
            .order_by(RecentlyPlayed.played_at.desc())
            .limit(8)
        ).unique()
    )
    liked_tracks = list(
        db.scalars(
            track_query()
            .join(LikedTrack, LikedTrack.track_id == Track.id)
            .where(LikedTrack.user_id == user.id)
            .where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))
            .order_by(LikedTrack.created_at.desc())
            .limit(8)
        ).unique()
    )
    saved_albums = list(
        db.scalars(
            select(Album)
            .options(joinedload(Album.artist))
            .join(SavedAlbum, SavedAlbum.album_id == Album.id)
            .join(Track, Track.album_id == Album.id)
            .where(SavedAlbum.user_id == user.id)
            .where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))
            .order_by(SavedAlbum.created_at.desc())
            .limit(6)
        ).unique()
    )
    artist_ids = []
    for track in all_tracks:
        if track.artist_id not in artist_ids:
            artist_ids.append(track.artist_id)
    popular_artists = list(
        db.scalars(select(Artist).where(Artist.id.in_(artist_ids)).order_by(Artist.name).limit(6))
    )
    recent_tracks = [track for track in recent_tracks if track.id not in featured_ids][:8]
    liked_tracks = [track for track in liked_tracks if track.id not in featured_ids][:8]

    sections: List[BrowseSectionOut] = []
    if recent_tracks:
        sections.append(
            BrowseSectionOut(
                title="Recently played",
                subtitle="Jump back into what you started",
                tracks=[TrackOut.model_validate(track) for track in recent_tracks],
            )
        )
    if liked_tracks:
        sections.append(
            BrowseSectionOut(
                title="Liked songs",
                subtitle="Your favorites in one place",
                tracks=[TrackOut.model_validate(track) for track in liked_tracks],
            )
        )
    sections.append(
        BrowseSectionOut(
            title="Trending now",
            subtitle="Fresh picks from the catalog",
            tracks=[TrackOut.model_validate(track) for track in all_tracks[:8]],
        )
    )

    return BrowseHomeOut(
        greeting=greeting_for_hour(hour),
        featured_tracks=[TrackOut.model_validate(track) for track in all_tracks[:6]],
        made_for_you=[TrackOut.model_validate(track) for track in recommended],
        sections=sections,
        popular_artists=[ArtistOut.model_validate(artist) for artist in popular_artists],
        saved_albums=[AlbumOut.model_validate(album) for album in saved_albums],
    )


def search_catalog(
    db: Session,
    query: str,
    artist: Optional[str] = None,
    album: Optional[str] = None,
    genre: Optional[str] = None,
) -> tuple[List[Track], List[Artist], List[Album]]:
    normalized = f"%{query.strip()}%"
    track_stmt = (
        tamil_track_query()
        .join(Track.artist)
        .join(Track.album)
        .where(
            or_(
                Track.title.ilike(normalized),
                Artist.name.ilike(normalized),
                Album.title.ilike(normalized),
            )
        )
    )
    artist_stmt = (
        select(Artist)
        .join(Track, Track.artist_id == Artist.id)
        .where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES), Artist.name.ilike(normalized))
        .distinct()
    )
    album_stmt = (
        select(Album)
        .options(joinedload(Album.artist))
        .join(Track, Track.album_id == Album.id)
        .where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES), Album.title.ilike(normalized))
        .distinct()
    )

    if artist:
        track_stmt = track_stmt.where(Artist.name.ilike(f"%{artist}%"))
    if album:
        track_stmt = track_stmt.where(Album.title.ilike(f"%{album}%"))
    if genre:
        track_stmt = track_stmt.where(
            or_(
                Track.genre.ilike(f"%{genre}%"),
                Album.genre.ilike(f"%{genre}%"),
                Artist.genre.ilike(f"%{genre}%"),
            )
        )
        artist_stmt = artist_stmt.where(Artist.genre.ilike(f"%{genre}%"))
        album_stmt = album_stmt.where(Album.genre.ilike(f"%{genre}%"))

    return (
        list(db.scalars(track_stmt.limit(20)).unique()),
        list(db.scalars(artist_stmt.limit(10))),
        list(db.scalars(album_stmt.limit(10)).unique()),
    )


def suggestion_terms(db: Session, query: str) -> List[str]:
    normalized = f"{query.strip()}%"
    tracks = db.scalars(
        select(Track.title).where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES), Track.title.ilike(normalized)).limit(5)
    ).all()
    artists = db.scalars(
        select(Artist.name)
        .join(Track, Track.artist_id == Artist.id)
        .where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES), Artist.name.ilike(normalized))
        .distinct()
        .limit(5)
    ).all()
    albums = db.scalars(
        select(Album.title)
        .join(Track, Track.album_id == Album.id)
        .where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES), Album.title.ilike(normalized))
        .distinct()
        .limit(5)
    ).all()
    seen: List[str] = []
    for term in [*tracks, *artists, *albums]:
        if term not in seen:
            seen.append(term)
    return seen[:10]


def stream_track_response(track: Track):
    if track.audio_url:
        return RedirectResponse(track.audio_url)
    if track.audio_path:
        file_path = Path(track.audio_path)
        if not file_path.is_file():
            raise HTTPException(status_code=404, detail="Audio file not found on server")
        return FileResponse(path=file_path, media_type="audio/mpeg", filename=file_path.name)
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Track does not have a configured audio source",
    )
