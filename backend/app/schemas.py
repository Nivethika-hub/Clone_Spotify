from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=120)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(default=None, max_length=500)


class PublicUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime


class UserProfile(PublicUser):
    follower_count: int = 0
    following_count: int = 0


class UserCard(UserProfile):
    is_following: bool = False


class ArtistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    bio: Optional[str] = None
    image_url: Optional[str] = None
    genre: Optional[str] = None


class AlbumOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    cover_image: Optional[str] = None
    genre: Optional[str] = None
    release_year: Optional[int] = None
    artist: ArtistOut


class TrackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    duration_seconds: int
    genre: Optional[str] = None
    audio_url: Optional[str] = None
    audio_path: Optional[str] = None
    artist: ArtistOut
    album: AlbumOut


class AlbumDetail(AlbumOut):
    tracks: List[TrackOut] = []


class ArtistDetail(ArtistOut):
    albums: List[AlbumOut] = []
    top_tracks: List[TrackOut] = []


class FollowResponse(BaseModel):
    following_user_id: int
    is_following: bool


class PlaylistCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    is_public: bool = True
    cover_image: Optional[str] = None


class PlaylistUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    is_public: Optional[bool] = None
    cover_image: Optional[str] = None


class PlaylistTrackAdd(BaseModel):
    track_id: int


class PlaylistTrackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position: int
    added_at: datetime
    track: TrackOut


class PlaylistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    is_public: bool
    cover_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    owner: PublicUser
    tracks: List[PlaylistTrackOut] = []


class PlaybackAction(BaseModel):
    track_id: Optional[int] = None
    queue_track_ids: Optional[List[int]] = None


class SeekRequest(BaseModel):
    position_seconds: float = Field(ge=0)


class VolumeRequest(BaseModel):
    volume: float = Field(ge=0, le=1)


class RepeatRequest(BaseModel):
    repeat_mode: Literal["off", "one", "all"]


class PlaybackStateOut(BaseModel):
    current_track: Optional[TrackOut] = None
    is_playing: bool
    position_seconds: float
    volume: float
    shuffle_enabled: bool
    repeat_mode: Literal["off", "one", "all"]
    queue_track_ids: List[int]


class SearchResponse(BaseModel):
    tracks: List[TrackOut]
    artists: List[ArtistOut]
    albums: List[AlbumOut]


class SuggestionResponse(BaseModel):
    suggestions: List[str]


class LibrarySnapshot(BaseModel):
    liked_tracks: List[TrackOut]
    saved_albums: List[AlbumOut]
    saved_artists: List[ArtistOut]
    recently_played: List[TrackOut]


class BrowseSectionOut(BaseModel):
    title: str
    subtitle: Optional[str] = None
    tracks: List[TrackOut]


class BrowseHomeOut(BaseModel):
    greeting: str
    featured_tracks: List[TrackOut]
    made_for_you: List[TrackOut]
    sections: List[BrowseSectionOut]
    popular_artists: List[ArtistOut]
    saved_albums: List[AlbumOut]
