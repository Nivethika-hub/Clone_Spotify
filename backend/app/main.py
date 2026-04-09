import os
import sys

# START ABSOLUTE TOP DIAGNOSTICS
print("--- STARTUP DIAGNOSTICS ---")
print(f"DEBUG: Python Executable: {sys.executable}")
print(f"DEBUG: PYTHONPATH: {os.getenv('PYTHONPATH')}")
print(f"DEBUG: CWD: {os.getcwd()}")
print(f"DEBUG: Directory Contents: {os.listdir('.')}")
if os.path.exists('app'):
    print(f"DEBUG: 'app' folder exists. Contents: {os.listdir('app')}")
else:
    print("DEBUG: 'app' folder NOT FOUND in current directory!")
print("--- END STARTUP DIAGNOSTICS ---")

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from app.database import Base, SessionLocal, engine
    from app.routers import auth, catalog, library, playback, playlists, users
    from app.seed import seed_catalog
except Exception as e:
    print(f"CRITICAL ERROR DURING IMPORT: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(3)

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
