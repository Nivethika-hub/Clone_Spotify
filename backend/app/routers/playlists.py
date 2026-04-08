from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Playlist, PlaylistTrack, Track, User
from app.schemas import PlaylistCreate, PlaylistOut, PlaylistTrackAdd, PlaylistUpdate
from app.services import ensure_starter_playlists, get_playlist_or_404


router = APIRouter(prefix="/playlists", tags=["playlists"])


@router.get("", response_model=List[PlaylistOut])
def list_playlists(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_starter_playlists(db, current_user)
    playlists = db.scalars(select(Playlist).where(Playlist.owner_id == current_user.id)).all()
    return [PlaylistOut.model_validate(get_playlist_or_404(db, playlist.id)) for playlist in playlists]


@router.post("", response_model=PlaylistOut, status_code=status.HTTP_201_CREATED)
def create_playlist(
    payload: PlaylistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    playlist = Playlist(owner_id=current_user.id, **payload.model_dump())
    db.add(playlist)
    db.commit()
    db.refresh(playlist)
    return PlaylistOut.model_validate(get_playlist_or_404(db, playlist.id))


@router.get("/{playlist_id}", response_model=PlaylistOut)
def get_playlist(playlist_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    playlist = get_playlist_or_404(db, playlist_id)
    if not playlist.is_public and playlist.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Playlist is private")
    return PlaylistOut.model_validate(playlist)


@router.patch("/{playlist_id}", response_model=PlaylistOut)
def update_playlist(
    playlist_id: int,
    payload: PlaylistUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    playlist = get_playlist_or_404(db, playlist_id)
    if playlist.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can edit this playlist")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(playlist, field, value)
    db.add(playlist)
    db.commit()
    return PlaylistOut.model_validate(get_playlist_or_404(db, playlist.id))


@router.delete("/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_playlist(
    playlist_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    playlist = get_playlist_or_404(db, playlist_id)
    if playlist.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can delete this playlist")
    db.delete(playlist)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{playlist_id}/tracks", response_model=PlaylistOut, status_code=status.HTTP_201_CREATED)
def add_track(
    playlist_id: int,
    payload: PlaylistTrackAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    playlist = get_playlist_or_404(db, playlist_id)
    if playlist.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can edit this playlist")
    track = db.get(Track, payload.track_id)
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found")
    next_position = db.scalar(
        select(func.coalesce(func.max(PlaylistTrack.position), 0) + 1).where(PlaylistTrack.playlist_id == playlist_id)
    )
    db.add(PlaylistTrack(playlist_id=playlist_id, track_id=payload.track_id, position=next_position or 1))
    db.commit()
    return PlaylistOut.model_validate(get_playlist_or_404(db, playlist_id))


@router.delete("/{playlist_id}/tracks/{playlist_track_id}", response_model=PlaylistOut)
def remove_track(
    playlist_id: int,
    playlist_track_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    playlist = get_playlist_or_404(db, playlist_id)
    if playlist.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can edit this playlist")
    playlist_track = db.scalar(
        select(PlaylistTrack).where(
            PlaylistTrack.playlist_id == playlist_id,
            PlaylistTrack.id == playlist_track_id,
        )
    )
    if playlist_track is None:
        raise HTTPException(status_code=404, detail="Playlist track not found")
    db.delete(playlist_track)
    db.commit()

    refreshed = get_playlist_or_404(db, playlist_id)
    for index, item in enumerate(refreshed.tracks, start=1):
        item.position = index
        db.add(item)
    db.commit()
    return PlaylistOut.model_validate(get_playlist_or_404(db, playlist_id))
