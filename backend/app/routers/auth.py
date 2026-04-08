from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_db
from app.models import User
from app.schemas import Token, UserCreate, UserLogin, UserProfile, UserProfileUpdate
from app.services import ensure_playback_state, ensure_starter_library, ensure_starter_playlists, user_profile


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.scalar(
        select(User).where(func.lower(User.email) == payload.email.lower())
    )
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        name=payload.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    ensure_playback_state(db, user)
    ensure_starter_library(db, user)
    ensure_starter_playlists(db, user)
    return Token(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    ensure_playback_state(db, user)
    ensure_starter_library(db, user)
    ensure_starter_playlists(db, user)
    return Token(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserProfile)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_profile(db, current_user)


@router.patch("/me", response_model=UserProfile)
def update_me(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(current_user, field, value)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return user_profile(db, current_user)
