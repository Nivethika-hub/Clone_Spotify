import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Clock3, Flame, ListMusic, Search, Sparkles, UserRound } from 'lucide-react';

import SectionShelf from '../components/SectionShelf';
import TrackRow from '../components/TrackRow';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { formatRelativeGreeting } from '../lib/formatters';
import { uniqueTracks } from '../lib/youtube';
import { handleImageFallback, withFallbackArt } from '../lib/media';

const Dashboard = () => {
  const { api, user } = useAuth();
  const { currentTrack, isPlaying, playCollection, playTrack } = usePlayer();
  const [home, setHome] = useState(null);
  const [library, setLibrary] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [homeResponse, libraryResponse, playlistResponse] = await Promise.all([
          api.get('/browse/home'),
          api.get('/library'),
          api.get('/playlists'),
        ]);
        setHome(homeResponse.data);
        setLibrary(libraryResponse.data);
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

  const toggleLike = async (track) => {
    const isLiked = Boolean(library?.liked_tracks?.some((item) => item.id === track.id));
    try {
      if (isLiked) {
        await api.delete(`/library/tracks/${track.id}/like`);
      } else {
        await api.post(`/library/tracks/${track.id}/like`);
      }
      const libraryResponse = await api.get('/library');
      setLibrary(libraryResponse.data);
    } catch (error) {
      console.error('Failed to update liked track:', error);
    }
  };

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
            <div>
              <strong>{track.title}</strong>
              <span>{track.artist?.name}</span>
            </div>
            <button
              type="button"
              className={`quick-like-button ${library?.liked_tracks?.some((item) => item.id === track.id) ? 'active' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                toggleLike(track);
              }}
              aria-label="Toggle like"
            >
              <Heart size={16} fill={library?.liked_tracks?.some((item) => item.id === track.id) ? 'currentColor' : 'none'} />
            </button>
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
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
