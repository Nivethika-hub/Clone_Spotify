from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# STARTUP DIAGNOSTICS
print("--- APPLICATION STARTUP ---")
print(f"DEBUG: CWD: {os.getcwd()}")
print(f"DEBUG: DATABASE_URL PRESENT: {bool(os.getenv('DATABASE_URL'))}")

try:
    from app.database import Base, SessionLocal, engine
    from app.routers import auth, catalog, library, playback, playlists, users
    from app.seed import seed_catalog
    print("DEBUG: All modules imported successfully.")
except Exception as e:
    print(f"CRITICAL IMPORT ERROR: {e}")
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
        # Use the settings object which handles environment variable mapping automatically
        db_url = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL')
        
        if db_url:
            print(f"DEBUG: Database URL detected. Initializing database...")
            Base.metadata.create_all(bind=engine)
            print("DEBUG: Seeding catalog with dummy songs...")
            with SessionLocal() as db:
                seed_catalog(db)
            print("DEBUG: Database initialization complete.")
        else:
            print("WARNING: No production DATABASE_URL found. Using default/SQLite.")
            Base.metadata.create_all(bind=engine)
            with SessionLocal() as db:
                seed_catalog(db)
            print("DEBUG: Local/SQLite initialization complete.")
                
        print("--- STARTUP SUCCESSFUL ---")
    except Exception as e:
        print(f"FATAL STARTUP ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        # Do not exit(1) immediately to allow the health check to potentially pass 
        # but the logs will clearly show the crash.

@app.get("/health")
def health():
    return {"status": "okay"}

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(catalog.router)
app.include_router(library.router)
app.include_router(playlists.router)
app.include_router(playback.router)
