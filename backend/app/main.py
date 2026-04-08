from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.routers import auth, catalog, library, playback, playlists, users
from app.seed import seed_catalog

app = FastAPI(title="Spotify Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_catalog(db)


@app.get("/health")
def health():
    return {"status": "okay"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(catalog.router)
app.include_router(library.router)
app.include_router(playlists.router)
app.include_router(playback.router)
