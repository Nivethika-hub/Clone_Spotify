from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.routers import auth, catalog, library, playback, playlists, users
from app.seed import seed_catalog
import os
import sys

print(f"DEBUG: Starting app with DATABASE_URL present: {bool(os.getenv('DATABASE_URL'))}")

app = FastAPI(title="Spotify Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    try:
        print("DEBUG: Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("DEBUG: Seeding catalog...")
        with SessionLocal() as db:
            seed_catalog(db)
        print("DEBUG: Startup complete!")
    except Exception as e:
        print(f"FATAL STARTUP ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        # On Render, we might want to exit so it doesn't just hang
        sys.exit(1)


@app.get("/health")
def health():
    return {"status": "okay"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(catalog.router)
app.include_router(library.router)
app.include_router(playlists.router)
app.include_router(playback.router)
