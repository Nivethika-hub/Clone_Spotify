from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import Album, Artist, LikedTrack, RecentlyPlayed, SavedAlbum, SavedArtist, Track, User
from app.schemas import AlbumOut, ArtistOut, LibrarySnapshot, TrackOut
from app.services import VISIBLE_TAMIL_TRACK_TITLES, add_recently_played, ensure_starter_library, track_query


router = APIRouter(prefix="/library", tags=["library"])


@router.get("", response_model=LibrarySnapshot)
def snapshot(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_starter_library(db, current_user)
    liked_tracks = list(
        db.scalars(
            track_query()
            .join(LikedTrack, LikedTrack.track_id == Track.id)
            .where(LikedTrack.user_id == current_user.id)
            .where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))
        ).unique()
    )
    saved_albums = list(
        db.scalars(
            select(Album)
            .options(joinedload(Album.artist))
            .join(SavedAlbum, SavedAlbum.album_id == Album.id)
            .join(Track, Track.album_id == Album.id)
            .where(SavedAlbum.user_id == current_user.id)
            .where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))
        ).unique()
    )
    saved_artists = list(
        db.scalars(
            select(Artist)
            .join(SavedArtist, SavedArtist.artist_id == Artist.id)
            .join(Track, Track.artist_id == Artist.id)
            .where(SavedArtist.user_id == current_user.id)
            .where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))
            .distinct()
        )
    )
    recently_played = list(
        db.scalars(
            track_query()
            .join(RecentlyPlayed, RecentlyPlayed.track_id == Track.id)
            .where(RecentlyPlayed.user_id == current_user.id)
            .where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))
            .order_by(RecentlyPlayed.played_at.desc())
            .limit(20)
        ).unique()
    )
    return LibrarySnapshot(
        liked_tracks=[TrackOut.model_validate(item) for item in liked_tracks],
        saved_albums=[AlbumOut.model_validate(item) for item in saved_albums],
        saved_artists=[ArtistOut.model_validate(item) for item in saved_artists],
        recently_played=[TrackOut.model_validate(item) for item in recently_played],
    )


@router.post("/tracks/{track_id}/like", status_code=status.HTTP_201_CREATED)
def like_track(track_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    track = db.get(Track, track_id)
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    existing = db.scalar(
        select(LikedTrack).where(LikedTrack.user_id == current_user.id, LikedTrack.track_id == track_id)
    )
    if existing is None:
        db.add(LikedTrack(user_id=current_user.id, track_id=track_id))
        db.commit()
    return {"liked": True, "track_id": track_id}


@router.post("/tracks/{track_id}/recent", status_code=status.HTTP_201_CREATED)
def mark_recent_track(track_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    track = db.get(Track, track_id)
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    add_recently_played(db, current_user.id, track_id)
    return {"recent": True, "track_id": track_id}


@router.delete("/tracks/{track_id}/like")
def unlike_track(track_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(delete(LikedTrack).where(LikedTrack.user_id == current_user.id, LikedTrack.track_id == track_id))
    db.commit()
    return {"liked": False, "track_id": track_id}


@router.post("/albums/{album_id}/save", status_code=status.HTTP_201_CREATED)
def save_album(album_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    album = db.get(Album, album_id)
    if album is None:
        raise HTTPException(status_code=404, detail="Album not found")
    existing = db.scalar(
        select(SavedAlbum).where(SavedAlbum.user_id == current_user.id, SavedAlbum.album_id == album_id)
    )
    if existing is None:
        db.add(SavedAlbum(user_id=current_user.id, album_id=album_id))
        db.commit()
    return {"saved": True, "album_id": album_id}


@router.delete("/albums/{album_id}/save")
def unsave_album(album_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(delete(SavedAlbum).where(SavedAlbum.user_id == current_user.id, SavedAlbum.album_id == album_id))
    db.commit()
    return {"saved": False, "album_id": album_id}


@router.post("/artists/{artist_id}/save", status_code=status.HTTP_201_CREATED)
def save_artist(artist_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    artist = db.get(Artist, artist_id)
    if artist is None:
        raise HTTPException(status_code=404, detail="Artist not found")
    existing = db.scalar(
        select(SavedArtist).where(SavedArtist.user_id == current_user.id, SavedArtist.artist_id == artist_id)
    )
    if existing is None:
        db.add(SavedArtist(user_id=current_user.id, artist_id=artist_id))
        db.commit()
    return {"saved": True, "artist_id": artist_id}


@router.delete("/artists/{artist_id}/save")
def unsave_artist(artist_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(delete(SavedArtist).where(SavedArtist.user_id == current_user.id, SavedArtist.artist_id == artist_id))
    db.commit()
    return {"saved": False, "artist_id": artist_id}
