import React, { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import EmptyState from '../components/EmptyState';
import TrackRow from '../components/TrackRow';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { handleImageFallback, withFallbackArt } from '../lib/media';

const ArtistPage = () => {
  const { artistId } = useParams();
  const { api, library, toggleLike, toggleArtistSave } = useAuth();
  const { currentTrack, isPlaying, playCollection, playTrack } = usePlayer();
  const [artist, setArtist] = useState(null);

  useEffect(() => {
    const loadArtist = async () => {
      try {
        const response = await api.get(`/artists/${artistId}`);
        setArtist(response.data);
      } catch (error) {
        console.error('Failed to load artist:', error);
      }
    };

    loadArtist();
  }, [api, artistId]);

  if (!artist) {
    return <div className="page page-loading">Loading artist...</div>;
  }

  const isSaved = Boolean(library?.saved_artists?.some((item) => item.id === artist.id));

  return (
    <div className="page">
      <section className="entity-hero artist-theme">
        <img src={withFallbackArt(artist.image_url)} alt={artist.name} onError={handleImageFallback} />
        <div className="entity-copy">
          <span className="eyebrow">Artist</span>
          <h1>{artist.name}</h1>
          <p>{artist.bio || `${artist.name} essentials and featured releases.`}</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => playCollection(artist.top_tracks)}>
              Play artist
            </button>
            <button 
              className={`secondary-button ${isSaved ? 'active' : ''}`} 
              onClick={() => toggleArtistSave(artist)}
              style={{ color: isSaved ? 'var(--accent)' : 'inherit' }}
            >
              <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
              {isSaved ? 'Saved artist' : 'Save artist'}
            </button>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <div>
            <h2>Popular</h2>
            <p>Top tracks and recent favorites.</p>
          </div>
        </div>
        <div className="track-table">
          {artist.top_tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              isActive={currentTrack?.id === track.id}
              isPlaying={isPlaying}
              isLiked={Boolean(library?.liked_tracks?.some((item) => item.id === track.id))}
              onToggleLike={toggleLike}
              onPlay={(selectedTrack) => playTrack(selectedTrack, artist.top_tracks)}
            />
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <div>
            <h2>Albums</h2>
            <p>Releases available in this demo catalog.</p>
          </div>
        </div>
        <div className="card-grid">
          {artist.albums.length ? (
            artist.albums.map((album) => (
              <Link key={album.id} to={`/albums/${album.id}`} className="media-card">
                <div className="media-card-image">
                  <img src={withFallbackArt(album.cover_image)} alt={album.title} onError={handleImageFallback} />
                </div>
                <strong>{album.title}</strong>
                <p>{album.release_year || artist.genre}</p>
              </Link>
            ))
          ) : (
            <EmptyState title="No albums found" description="This artist does not have albums in the demo catalog yet." />
          )}
        </div>
      </section>
    </div>
  );
};

export default ArtistPage;
