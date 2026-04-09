import React, { useEffect, useState } from 'react';
import { Library } from 'lucide-react';
import { useParams } from 'react-router-dom';

import TrackRow from '../components/TrackRow';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { handleImageFallback, withFallbackArt } from '../lib/media';

const AlbumPage = () => {
  const { albumId } = useParams();
  const { api, library, toggleLike, toggleAlbumSave } = useAuth();
  const { currentTrack, isPlaying, playCollection, playTrack } = usePlayer();
  const [album, setAlbum] = useState(null);


  useEffect(() => {
    const loadAlbum = async () => {
      try {
        const response = await api.get(`/albums/${albumId}`);
        setAlbum(response.data);
      } catch (error) {
        console.error('Failed to load album:', error);
      }
    };

    loadAlbum();
  }, [api, albumId]);

  if (!album) {
    return <div className="page page-loading">Loading album...</div>;
  }

  const isSaved = Boolean(library?.saved_albums?.some((item) => item.id === album.id));

  return (
    <div className="page">
      <section className="entity-hero album-theme">
        <img src={withFallbackArt(album.cover_image)} alt={album.title} onError={handleImageFallback} />
        <div className="entity-copy">
          <span className="eyebrow">Album</span>
          <h1>{album.title}</h1>
          <p>
            {album.artist?.name} • {album.release_year || 'Recent release'} • {album.genre || 'Tamil mix'}
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => playCollection(album.tracks)}>
              Play album
            </button>
            <button 
              className={`secondary-button ${isSaved ? 'active' : ''}`} 
              onClick={() => toggleAlbumSave(album)}
              style={{ color: isSaved ? 'var(--accent)' : 'inherit' }}
            >
              <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
              {isSaved ? 'Saved album' : 'Save album'}
            </button>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <div>
            <h2>Tracks</h2>
            <p>Play the full album from top to bottom.</p>
          </div>
        </div>
        <div className="track-table">
          {album.tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              isActive={currentTrack?.id === track.id}
              isPlaying={isPlaying}
              isLiked={Boolean(library?.liked_tracks?.some((item) => item.id === track.id))}
              onToggleLike={toggleLike}
              onPlay={(selectedTrack) => playTrack(selectedTrack, album.tracks)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default AlbumPage;
