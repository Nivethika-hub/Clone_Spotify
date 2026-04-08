import React, { useEffect, useState } from 'react';
import { Library } from 'lucide-react';
import { useParams } from 'react-router-dom';

import TrackRow from '../components/TrackRow';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { handleImageFallback, withFallbackArt } from '../lib/media';

const AlbumPage = () => {
  const { albumId } = useParams();
  const { api } = useAuth();
  const { currentTrack, isPlaying, playCollection, playTrack } = usePlayer();
  const [album, setAlbum] = useState(null);
  const [saved, setSaved] = useState(false);
  const [likedTrackIds, setLikedTrackIds] = useState([]);

  useEffect(() => {
    const loadAlbum = async () => {
      try {
        const [albumResponse, libraryResponse] = await Promise.all([
          api.get(`/albums/${albumId}`),
          api.get('/library'),
        ]);
        setAlbum(albumResponse.data);
        setSaved(libraryResponse.data.saved_albums.some((item) => item.id === Number(albumId)));
        setLikedTrackIds(libraryResponse.data.liked_tracks.map((track) => track.id));
      } catch (error) {
        console.error('Failed to load album:', error);
      }
    };

    loadAlbum();
  }, [api, albumId]);

  if (!album) {
    return <div className="page page-loading">Loading album...</div>;
  }

  const toggleSaveAlbum = async () => {
    try {
      if (saved) {
        await api.delete(`/library/albums/${album.id}/save`);
        setSaved(false);
      } else {
        await api.post(`/library/albums/${album.id}/save`);
        setSaved(true);
      }
    } catch (error) {
      console.error('Failed to update saved album:', error);
    }
  };

  const toggleLike = async (track) => {
    const isLiked = likedTrackIds.includes(track.id);
    try {
      if (isLiked) {
        await api.delete(`/library/tracks/${track.id}/like`);
        setLikedTrackIds((current) => current.filter((trackId) => trackId !== track.id));
      } else {
        await api.post(`/library/tracks/${track.id}/like`);
        setLikedTrackIds((current) => [...current, track.id]);
      }
    } catch (error) {
      console.error('Failed to update liked songs:', error);
    }
  };

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
            <button className="secondary-button" onClick={toggleSaveAlbum}>
              <Library size={16} />
              {saved ? 'Saved album' : 'Save album'}
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
              isLiked={likedTrackIds.includes(track.id)}
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
