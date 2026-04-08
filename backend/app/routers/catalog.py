from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import Album, Artist, Track, User
from app.schemas import (
    AlbumDetail,
    AlbumOut,
    ArtistDetail,
    ArtistOut,
    BrowseHomeOut,
    SearchResponse,
    SuggestionResponse,
    TrackOut,
)
from app.services import (
    VISIBLE_TAMIL_TRACK_TITLES,
    build_browse_home,
    search_catalog,
    stream_track_response,
    suggestion_terms,
    tamil_track_query,
    track_query,
)


router = APIRouter(tags=["catalog"])


@router.get("/tracks", response_model=List[TrackOut])
def list_tracks(db: Session = Depends(get_db)):
    return list(db.scalars(tamil_track_query().order_by(Track.created_at.desc()).limit(10)).unique())


@router.get("/tracks/{track_id}", response_model=TrackOut)
def get_track(track_id: int, db: Session = Depends(get_db)):
    track = db.scalars(track_query().where(Track.id == track_id)).unique().first()
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    return track


@router.get("/tracks/{track_id}/stream")
def stream_track(track_id: int, db: Session = Depends(get_db)):
    track = db.scalar(select(Track).where(Track.id == track_id))
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    return stream_track_response(track)


@router.get("/artists", response_model=List[ArtistOut])
def list_artists(db: Session = Depends(get_db)):
    return list(
        db.scalars(
            select(Artist)
            .join(Track, Track.artist_id == Artist.id)
            .where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))
            .order_by(Artist.name)
            .distinct()
        )
    )


@router.get("/albums", response_model=List[AlbumOut])
def list_albums(db: Session = Depends(get_db)):
    return list(
        db.scalars(
            select(Album)
            .options(joinedload(Album.artist))
            .join(Track, Track.album_id == Album.id)
            .where(Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))
            .order_by(Album.title)
            .distinct()
        ).unique()
    )


@router.get("/artists/{artist_id}", response_model=ArtistDetail)
def get_artist(artist_id: int, db: Session = Depends(get_db)):
    artist = db.scalar(select(Artist).where(Artist.id == artist_id))
    if artist is None:
        raise HTTPException(status_code=404, detail="Artist not found")

    top_tracks = list(
        db.scalars(track_query().where(Track.artist_id == artist_id, Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))).unique()
    )
    if not top_tracks:
        raise HTTPException(status_code=404, detail="Artist not found")

    albums = list(
        db.scalars(
            select(Album)
            .options(joinedload(Album.artist))
            .join(Track, Track.album_id == Album.id)
            .where(Album.artist_id == artist_id, Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))
            .distinct()
        ).unique()
    )
    return ArtistDetail(
        **ArtistOut.model_validate(artist).model_dump(),
        albums=[AlbumOut.model_validate(album) for album in albums],
        top_tracks=[TrackOut.model_validate(track) for track in top_tracks],
    )


@router.get("/albums/{album_id}", response_model=AlbumDetail)
def get_album(album_id: int, db: Session = Depends(get_db)):
    album = db.scalar(select(Album).options(joinedload(Album.artist)).where(Album.id == album_id))
    if album is None:
        raise HTTPException(status_code=404, detail="Album not found")

    tracks = list(
        db.scalars(track_query().where(Track.album_id == album_id, Track.title.in_(VISIBLE_TAMIL_TRACK_TITLES))).unique()
    )
    if not tracks:
        raise HTTPException(status_code=404, detail="Album not found")
    return AlbumDetail(
        **AlbumOut.model_validate(album).model_dump(),
        tracks=[TrackOut.model_validate(track) for track in tracks],
    )


@router.get("/search", response_model=SearchResponse)
def search(
    q: str = Query(min_length=1),
    artist: Optional[str] = None,
    album: Optional[str] = None,
    genre: Optional[str] = None,
    db: Session = Depends(get_db),
):
    tracks, artists, albums = search_catalog(db, q, artist=artist, album=album, genre=genre)
    return SearchResponse(
        tracks=[TrackOut.model_validate(track) for track in tracks],
        artists=[ArtistOut.model_validate(item) for item in artists],
        albums=[AlbumOut.model_validate(item) for item in albums],
    )


@router.get("/search/suggestions", response_model=SuggestionResponse)
def suggestions(q: str = Query(min_length=1), db: Session = Depends(get_db)):
    return SuggestionResponse(suggestions=suggestion_terms(db, q))


@router.get("/browse/home", response_model=BrowseHomeOut)
def browse_home(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return build_browse_home(db, current_user, datetime.now().hour)
