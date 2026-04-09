from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Album, Artist, Track


def art_cover(color_one: str, color_two: str, color_three: str) -> str:
    svg = f"""
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'>
      <defs>
        <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='{color_one}'/>
          <stop offset='55%' stop-color='{color_two}'/>
          <stop offset='100%' stop-color='{color_three}'/>
        </linearGradient>
      </defs>
      <rect width='600' height='600' fill='url(#bg)' rx='42'/>
      <circle cx='135' cy='135' r='90' fill='rgba(255,255,255,0.18)'/>
      <circle cx='465' cy='180' r='110' fill='rgba(255,255,255,0.10)'/>
      <circle cx='360' cy='440' r='150' fill='rgba(0,0,0,0.18)'/>
      <path d='M80 430 C190 350 315 350 520 500' fill='none' stroke='rgba(255,255,255,0.28)' stroke-width='28' stroke-linecap='round'/>
      <path d='M110 505 C230 425 360 420 520 550' fill='none' stroke='rgba(255,255,255,0.18)' stroke-width='18' stroke-linecap='round'/>
    </svg>
    """.strip()
    return f"data:image/svg+xml;utf8,{quote(svg)}"


ROWDY_COVER = art_cover("#451919", "#8f2d2d", "#f08a5d")
VAATHI_COVER = art_cover("#1f2430", "#3a506b", "#f5c156")
KOLAVERI_COVER = art_cover("#28170f", "#6e3b2c", "#d9a066")
ENJAAMI_COVER = art_cover("#112227", "#1f5561", "#8ce0d7")
ARABIC_COVER = art_cover("#251612", "#954535", "#f3b562")
MUNBE_COVER = art_cover("#102321", "#2d5d56", "#c8facc")
VASEEGARA_COVER = art_cover("#241326", "#6f3b73", "#f5b0cb")
MEGHAM_COVER = art_cover("#0f1f33", "#355c7d", "#8fd3f4")
NAATU_COVER = art_cover("#24170d", "#7a4d25", "#f6c667")
OO_ANTAVA_COVER = art_cover("#1f1321", "#6b2d5c", "#f18bb8")


def seed_catalog(db: Session) -> None:
    catalog = [
        {
            "artist": {
                "name": "Dhanush",
                "genre": "Tamil Film",
                "bio": "Actor-singer with instantly recognizable Tamil chart hits.",
                "image_url": ROWDY_COVER,
            },
            "album": {
                "title": "Maari 2",
                "genre": "Tamil Film",
                "release_year": 2018,
                "cover_image": ROWDY_COVER,
            },
            "tracks": [
                {
                    "title": "Rowdy Baby",
                    "duration_seconds": 219,
                    "genre": "Tamil Film",
                    "audio_url": "https://www.youtube.com/embed/x6Q7c9RyMzk",
                }
            ],
        },
        {
            "artist": {
                "name": "Anirudh Ravichander",
                "genre": "Tamil Film",
                "bio": "High-energy film composer behind many modern Tamil anthems.",
                "image_url": VAATHI_COVER,
            },
            "album": {
                "title": "Master",
                "genre": "Tamil Film",
                "release_year": 2021,
                "cover_image": VAATHI_COVER,
            },
            "tracks": [
                {
                    "title": "Vaathi Coming",
                    "duration_seconds": 229,
                    "genre": "Tamil Film",
                    "audio_url": "https://www.youtube.com/embed/fRD_3vJagxk",
                }
            ],
        },
        {
            "artist": {
                "name": "Dhanush",
                "genre": "Tamil Film",
                "bio": "Actor-singer with instantly recognizable Tamil chart hits.",
                "image_url": KOLAVERI_COVER,
            },
            "album": {
                "title": "3",
                "genre": "Tamil Film",
                "release_year": 2011,
                "cover_image": KOLAVERI_COVER,
            },
            "tracks": [
                {
                    "title": "Why This Kolaveri Di",
                    "duration_seconds": 251,
                    "genre": "Tamil Film",
                    "audio_url": "https://www.youtube.com/embed/YR12Z8f1Dh8",
                }
            ],
        },
        {
            "artist": {
                "name": "Dhee",
                "genre": "Tamil Alternative",
                "bio": "Distinctive Tamil vocalist with bold crossover releases.",
                "image_url": ENJAAMI_COVER,
            },
            "album": {
                "title": "Single",
                "genre": "Tamil Alternative",
                "release_year": 2021,
                "cover_image": ENJAAMI_COVER,
            },
            "tracks": [
                {
                    "title": "Enjoy Enjaami",
                    "duration_seconds": 279,
                    "genre": "Tamil Alternative",
                    "audio_url": "https://www.youtube.com/embed/eYq7WapuDLU",
                }
            ],
        },
        {
            "artist": {
                "name": "Anirudh Ravichander",
                "genre": "Tamil Film",
                "bio": "High-energy film composer behind many modern Tamil anthems.",
                "image_url": ARABIC_COVER,
            },
            "album": {
                "title": "Beast",
                "genre": "Tamil Film",
                "release_year": 2022,
                "cover_image": ARABIC_COVER,
            },
            "tracks": [
                {
                    "title": "Arabic Kuthu",
                    "duration_seconds": 261,
                    "genre": "Tamil Film",
                    "audio_url": "https://www.youtube.com/embed/KUN5Uf9mObQ",
                }
            ],
        },
        {
            "artist": {
                "name": "A.R. Rahman",
                "genre": "Tamil Melody",
                "bio": "Iconic composer known for cinematic melodies and textured arrangements.",
                "image_url": MUNBE_COVER,
            },
            "album": {
                "title": "Sillunu Oru Kadhal",
                "genre": "Tamil Melody",
                "release_year": 2006,
                "cover_image": MUNBE_COVER,
            },
            "tracks": [
                {
                    "title": "Munbe Vaa",
                    "duration_seconds": 357,
                    "genre": "Tamil Melody",
                    "audio_url": "https://www.youtube.com/embed/rp3_FhRnIRw",
                }
            ],
        },
        {
            "artist": {
                "name": "Bombay Jayashri",
                "genre": "Tamil Melody",
                "bio": "Timeless voice behind elegant Tamil romantic classics.",
                "image_url": VASEEGARA_COVER,
            },
            "album": {
                "title": "Minnale",
                "genre": "Tamil Melody",
                "release_year": 2001,
                "cover_image": VASEEGARA_COVER,
            },
            "tracks": [
                {
                    "title": "Vaseegara",
                    "duration_seconds": 299,
                    "genre": "Tamil Melody",
                    "audio_url": "https://www.youtube.com/embed/ew1fKCWb_M4",
                }
            ],
        },
        {
            "artist": {
                "name": "Dhanush",
                "genre": "Tamil Film",
                "bio": "Actor-singer with instantly recognizable Tamil chart hits.",
                "image_url": MEGHAM_COVER,
            },
            "album": {
                "title": "Thiruchitrambalam",
                "genre": "Tamil Film",
                "release_year": 2022,
                "cover_image": MEGHAM_COVER,
            },
            "tracks": [
                {
                    "title": "Megham Karukatha",
                    "duration_seconds": 274,
                    "genre": "Tamil Film",
                    "audio_url": "https://www.youtube.com/embed/cEWwJxEq9Lg",
                }
            ],
        },
        {
            "artist": {
                "name": "M.M. Keeravani",
                "genre": "Tamil Film",
                "bio": "Epic soundtrack composer with pan-Indian chart hits.",
                "image_url": NAATU_COVER,
            },
            "album": {
                "title": "RRR",
                "genre": "Tamil Film",
                "release_year": 2022,
                "cover_image": NAATU_COVER,
            },
            "tracks": [
                {
                    "title": "Naatu Naatu",
                    "duration_seconds": 214,
                    "genre": "Tamil Film",
                    "audio_url": "https://www.youtube.com/embed/79IEesucPo8",
                }
            ],
        },
        {
            "artist": {
                "name": "Devi Sri Prasad",
                "genre": "Tamil Film",
                "bio": "Massy composer with instantly catchy South Indian soundtracks.",
                "image_url": OO_ANTAVA_COVER,
            },
            "album": {
                "title": "Pushpa",
                "genre": "Tamil Film",
                "release_year": 2021,
                "cover_image": OO_ANTAVA_COVER,
            },
            "tracks": [
                {
                    "title": "Oo Antava",
                    "duration_seconds": 223,
                    "genre": "Tamil Film",
                    "audio_url": "https://www.youtube.com/embed/u_wB6byrl5k",
                }
            ],
        },
    ]

    for entry in catalog:
        artist = db.scalar(select(Artist).where(Artist.name == entry["artist"]["name"]))
        if artist is None:
            artist = Artist(**entry["artist"])
            db.add(artist)
            db.flush()
        else:
            for field, value in entry["artist"].items():
                setattr(artist, field, value)

        album = db.scalar(select(Album).where(Album.title == entry["album"]["title"]))
        if album is None:
            album = Album(**entry["album"], artist=artist)
            db.add(album)
            db.flush()
        else:
            for field, value in entry["album"].items():
                setattr(album, field, value)
            album.artist = artist

        for track_data in entry["tracks"]:
            track = db.scalar(select(Track).where(Track.title == track_data["title"]))
            if track is None:
                track = Track(**track_data, artist=artist, album=album)
                db.add(track)
            else:
                for field, value in track_data.items():
                    setattr(track, field, value)
                track.artist = artist
                track.album = album

    db.commit()

