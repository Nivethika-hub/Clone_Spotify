import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Clock3, Disc, Flame, ListMusic, Search, Sparkles, UserCircle, UserRound } from 'lucide-react';

import SectionShelf from '../components/SectionShelf';
import TrackRow from '../components/TrackRow';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { formatRelativeGreeting } from '../lib/formatters';
import { uniqueTracks } from '../lib/youtube';
import { handleImageFallback, withFallbackArt } from '../lib/media';

const Dashboard = () => {
  const { api, user, library, toggleLike, toggleAlbumSave, toggleArtistSave } = useAuth();
  const { currentTrack, isPlaying, playCollection, playTrack } = usePlayer();
  const [home, setHome] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [homeResponse, playlistResponse] = await Promise.all([
          api.get('/browse/home'),
          api.get('/playlists'),
        ]);

        let homeData = homeResponse.data;
        
        // SAFE FALLBACK: If backend sent no tracks, use our predefined 10 songs
        if (!homeData.featured_tracks || homeData.featured_tracks.length === 0) {
          const fallbackTracks = [
            { id: 1, title: 'Oo Antava', artist: { id: 1, name: 'Devi Sri Prasad' }, album: { id: 1, title: 'Pushpa', cover_image: 'https://i.ytimg.com/vi/u_wB6byrl5k/maxresdefault.jpg' } },
            { id: 2, title: 'Naatu Naatu', artist: { id: 2, name: 'M.M. Keeravani' }, album: { id: 2, title: 'RRR', cover_image: 'https://i.ytimg.com/vi/79IEesucPo8/maxresdefault.jpg' } },
            { id: 3, title: 'Megham Karukatha', artist: { id: 3, name: 'Dhanush' }, album: { id: 3, title: 'Thiruchitrambalam', cover_image: 'https://i.ytimg.com/vi/cEWwJxEq9Lg/maxresdefault.jpg' } },
            { id: 4, title: 'Vaseegara', artist: { id: 4, name: 'Bombay Jayashri' }, album: { id: 4, title: 'Minnale', cover_image: 'https://i.ytimg.com/vi/ew1fKCWb_M4/maxresdefault.jpg' } },
            { id: 5, title: 'Munbe Vaa', artist: { id: 5, name: 'A.R. Rahman' }, album: { id: 5, title: 'Sillunu Oru Kadhal', cover_image: 'https://i.ytimg.com/vi/rp3_FhRnIRw/maxresdefault.jpg' } },
            { id: 6, title: 'Arabic Kuthu', artist: { id: 6, name: 'Anirudh Ravichander' }, album: { id: 6, title: 'Beast', cover_image: 'https://i.ytimg.com/vi/KUN5Uf9mObQ/maxresdefault.jpg' } },
            { id: 7, title: 'Enjoy Enjaami', artist: { id: 7, name: 'Dhee' }, album: { id: 7, title: 'Single', cover_image: 'https://i.ytimg.com/vi/eYq7WapuDLU/maxresdefault.jpg' } },
            { id: 8, title: 'Why This Kolaveri Di', artist: { id: 8, name: 'Dhanush' }, album: { id: 8, title: '3', cover_image: 'https://i.ytimg.com/vi/YR12Z8f1Dh8/maxresdefault.jpg' } },
            { id: 9, title: 'Rowdy Baby', artist: { id: 9, name: 'Dhanush' }, album: { id: 9, title: 'Maari 2', cover_image: 'https://i.ytimg.com/vi/x6Q7c9RyMzk/maxresdefault.jpg' } },
            { id: 10, title: 'Vaathi Coming', artist: { id: 10, name: 'Anirudh Ravichander' }, album: { id: 10, title: 'Master', cover_image: 'https://i.ytimg.com/vi/fRD_3vJagxk/maxresdefault.jpg' } },
          ];
          homeData.featured_tracks = fallbackTracks;
          homeData.made_for_you = fallbackTracks.slice(0, 5);
        }

        setHome(homeData);
        setPlaylists(playlistResponse.data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [api]);

  if (loading) {
    return <div className="page page-loading">Loading your dashboard...</div>;
  }

  if (!home) {
    return <div className="page page-loading">We could not load the dashboard right now.</div>;
  }

  const quickAccess = uniqueTracks([...home.featured_tracks, ...home.made_for_you]).slice(0, 8);

  return (
    <div className="page">
      <section className="chip-row">
        <button className="filter-chip active">All</button>
        <Link className="filter-chip" to="/search">Music</Link>
        <Link className="filter-chip" to="/library">Your Library</Link>
        <Link className="filter-chip" to="/playlists">Playlists</Link>
      </section>

      <section className="quick-grid">
        {quickAccess.map((track, index) => (
          <div
            key={`quick-${track.id}-${index}`}
            className="quick-card"
            role="button"
            tabIndex={0}
            onClick={() => playTrack(track, quickAccess)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                playTrack(track, quickAccess);
              }
            }}
          >
            <img src={withFallbackArt(track.album?.cover_image)} alt={track.title} onError={handleImageFallback} />
            <div className="quick-info">
              <strong>{track.title}</strong>
              <span>{track.artist?.name}</span>
            </div>
            <div className="quick-actions">
              <button
                type="button"
                className={`quick-action-btn ${library?.liked_tracks?.some((item) => item.id === track.id) ? 'active' : ''}`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleLike(track);
                }}
                title="Like song"
              >
                <Heart size={14} fill={library?.liked_tracks?.some((item) => item.id === track.id) ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                className={`quick-action-btn ${library?.saved_albums?.some((item) => item.id === track.album?.id) ? 'active-album' : ''}`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleAlbumSave(track.album);
                }}
                title="Save album"
              >
                <Disc size={14} fill={library?.saved_albums?.some((item) => item.id === track.album?.id) ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                className={`quick-action-btn ${library?.saved_artists?.some((item) => item.id === track.artist?.id) ? 'active-artist' : ''}`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleArtistSave(track.artist);
                }}
                title="Follow artist"
              >
                <UserCircle size={14} fill={library?.saved_artists?.some((item) => item.id === track.artist?.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="feature-shortcuts">
        <Link to="/search" className="feature-shortcut">
          <div className="feature-icon"><Search size={18} /></div>
          <div>
            <strong>Search Tamil tracks</strong>
            <span>Find songs, artists, albums, and jump directly into playback.</span>
          </div>
        </Link>
        <Link to="/library" className="feature-shortcut">
          <div className="feature-icon"><Clock3 size={18} /></div>
          <div>
            <strong>Open your library</strong>
            <span>Liked songs, recent plays, saved albums, and artists are organized here.</span>
          </div>
        </Link>
        <Link to="/playlists" className="feature-shortcut">
          <div className="feature-icon"><ListMusic size={18} /></div>
          <div>
            <strong>Manage playlists</strong>
            <span>Create, edit, and fill playlists with tracks from the catalog.</span>
          </div>
        </Link>
        <Link to="/profile" className="feature-shortcut">
          <div className="feature-icon"><UserRound size={18} /></div>
          <div>
            <strong>Profile and social</strong>
            <span>Update your account and follow other listeners from one place.</span>
          </div>
        </Link>
      </section>

      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">{home.greeting || formatRelativeGreeting()}</span>
          <h1>{user?.name}, welcome back to Tamil vibe central.</h1>
          <p>
            Jump into recent Tamil tracks, playlist shortcuts, and interactive shelves that feel
            closer to the Spotify desktop app in your reference.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => playCollection(home.featured_tracks)}>
              Play Tamil mix
            </button>
            <Link className="secondary-button" to="/playlists">
              Manage playlists
            </Link>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <Sparkles size={18} />
            <div>
              <strong>{home.made_for_you.length}</strong>
              <span>Recommendations</span>
            </div>
          </div>
          <div className="stat-card">
            <Clock3 size={18} />
            <div>
              <strong>{library?.recently_played?.length || 0}</strong>
              <span>Recently played</span>
            </div>
          </div>
          <div className="stat-card">
            <ListMusic size={18} />
            <div>
              <strong>{playlists.length}</strong>
              <span>Your playlists</span>
            </div>
          </div>
          <div className="stat-card">
            <Flame size={18} />
            <div>
              <strong>{home.featured_tracks.length}</strong>
              <span>Hot picks</span>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <div>
            <h2>Featured tracks</h2>
            <p>Start anywhere. Everything below can be played instantly.</p>
          </div>
        </div>
        <div className="track-table">
          {home.featured_tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              isActive={currentTrack?.id === track.id}
              isPlaying={isPlaying}
              isLiked={Boolean(library?.liked_tracks?.some((item) => item.id === track.id))}
              onPlay={(selectedTrack) => playTrack(selectedTrack, home.featured_tracks)}
              onToggleLike={toggleLike}
            />
          ))}
        </div>
      </section>

      <SectionShelf
        title="Made for you"
        subtitle="Recommendations shaped by what you already played and liked."
        items={home.made_for_you}
        onSelect={(track) => playTrack(track, home.made_for_you)}
      />

      {home.sections.map((section) => (
        <SectionShelf
          key={section.title}
          title={section.title}
          subtitle={section.subtitle}
          items={section.tracks}
          onSelect={(track) => playTrack(track, section.tracks)}
        />
      ))}

      <section className="dashboard-split">
        <div className="panel">
          <div className="section-header">
            <div>
              <h2>Saved albums</h2>
              <p>Albums you can jump back into fast.</p>
            </div>
          </div>
          <div className="compact-list">
            {home.saved_albums.length ? (
              home.saved_albums.map((album) => (
                <div className="compact-list-item" key={album.id}>
                  <img src={withFallbackArt(album.cover_image)} alt={album.title} onError={handleImageFallback} />
                  <div>
                    <strong>{album.title}</strong>
                    <span>{album.artist?.name}</span>
                  </div>
                  <button
                    type="button"
                    className={`quick-like-button ${library?.saved_albums?.some((item) => item.id === album.id) ? 'active' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleAlbumSave(album);
                    }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: library?.saved_albums?.some((item) => item.id === album.id) ? 'var(--primary-accent)' : 'var(--text-subdued)' }}
                  >
                    <Heart size={16} fill={library?.saved_albums?.some((item) => item.id === album.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              ))
            ) : (
              <p className="muted-copy">Save albums from search or your library to see them here.</p>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <h2>Popular artists</h2>
              <p>Fresh names from the demo catalog.</p>
            </div>
          </div>
          <div className="artist-stack">
            {home.popular_artists.map((artist) => (
              <div className="artist-pill" key={artist.id}>
                <img src={withFallbackArt(artist.image_url)} alt={artist.name} onError={handleImageFallback} />
                <div>
                  <strong>{artist.name}</strong>
                  <span>{artist.genre}</span>
                </div>
                <button
                  type="button"
                  className={`quick-like-button ${library?.saved_artists?.some((item) => item.id === artist.id) ? 'active' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleArtistSave(artist);
                  }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: library?.saved_artists?.some((item) => item.id === artist.id) ? 'var(--primary-accent)' : 'var(--text-subdued)' }}
                >
                  <Heart size={16} fill={library?.saved_artists?.some((item) => item.id === artist.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
