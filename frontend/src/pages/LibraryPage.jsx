import React, { useCallback, useEffect, useState } from 'react';

import EmptyState from '../components/EmptyState';
import TrackRow from '../components/TrackRow';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { handleImageFallback, withFallbackArt } from '../lib/media';

const LibraryPage = () => {
  const { api } = useAuth();
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadLibrary = useCallback(async () => {
    try {
      const response = await api.get('/library');
      setLibrary(response.data);
    } catch (error) {
      console.error('Failed to load library:', error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const toggleLike = async (track) => {
    const isLiked = library?.liked_tracks?.some((item) => item.id === track.id);
    try {
      if (isLiked) {
        await api.delete(`/library/tracks/${track.id}/like`);
      } else {
        await api.post(`/library/tracks/${track.id}/like`);
      }
      await loadLibrary();
    } catch (error) {
      console.error('Failed to update liked track:', error);
    }
  };

  const saveAlbum = async (albumId, isSaved) => {
    try {
      if (isSaved) {
        await api.delete(`/library/albums/${albumId}/save`);
      } else {
        await api.post(`/library/albums/${albumId}/save`);
      }
      await loadLibrary();
    } catch (error) {
      console.error('Failed to update album save state:', error);
    }
  };

  const saveArtist = async (artistId, isSaved) => {
    try {
      if (isSaved) {
        await api.delete(`/library/artists/${artistId}/save`);
      } else {
        await api.post(`/library/artists/${artistId}/save`);
      }
      await loadLibrary();
    } catch (error) {
      console.error('Failed to update artist save state:', error);
    }
  };

  if (loading) {
    return <div className="page page-loading">Loading library...</div>;
  }

  if (!library) {
    return <div className="page page-loading">Library is unavailable right now.</div>;
  }

  return (
    <div className="page">
      <section className="content-section">
        <div className="section-header">
          <div>
            <h2>Liked songs</h2>
            <p>Your personal collection of saved tracks.</p>
          </div>
        </div>
        {library.liked_tracks.length ? (
          <div className="track-table">
            {library.liked_tracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                isActive={currentTrack?.id === track.id}
                isPlaying={isPlaying}
                isLiked
                onPlay={(selectedTrack) => playTrack(selectedTrack, library.liked_tracks)}
                onToggleLike={toggleLike}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No liked songs yet"
            description="Like tracks from the dashboard or search results to build this collection."
          />
        )}
      </section>

      <section className="dashboard-split">
        <div className="panel">
          <div className="section-header">
            <div>
              <h2>Saved albums</h2>
              <p>Albums pinned to your library.</p>
            </div>
          </div>
          <div className="compact-list">
            {library.saved_albums.length ? (
              library.saved_albums.map((album) => (
                <div className="compact-list-item" key={album.id}>
                  <img src={withFallbackArt(album.cover_image)} alt={album.title} onError={handleImageFallback} />
                  <div>
                    <strong>{album.title}</strong>
                    <span>{album.artist?.name}</span>
                  </div>
                  <button className="chip action-chip" onClick={() => saveAlbum(album.id, true)}>
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="muted-copy">Save albums to keep them close.</p>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <h2>Saved artists</h2>
              <p>Artists you are following in your library.</p>
            </div>
          </div>
          <div className="compact-list">
            {library.saved_artists.length ? (
              library.saved_artists.map((artist) => (
                <div className="compact-list-item" key={artist.id}>
                  <img src={withFallbackArt(artist.image_url)} alt={artist.name} onError={handleImageFallback} />
                  <div>
                    <strong>{artist.name}</strong>
                    <span>{artist.genre}</span>
                  </div>
                  <button className="chip action-chip" onClick={() => saveArtist(artist.id, true)}>
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="muted-copy">Save artists from search to build this area out.</p>
            )}
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <div>
            <h2>Recently played</h2>
            <p>Return to tracks you listened to recently.</p>
          </div>
        </div>
        {library.recently_played.length ? (
          <div className="track-table">
            {library.recently_played.map((track, index) => (
              <TrackRow
                key={`${track.id}-${index}`}
                track={track}
                index={index}
                isActive={currentTrack?.id === track.id}
                isPlaying={isPlaying}
                isLiked={library.liked_tracks.some((item) => item.id === track.id)}
                onPlay={(selectedTrack) => playTrack(selectedTrack, library.recently_played)}
                onToggleLike={toggleLike}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing played yet" description="Start listening and your history will show up here." />
        )}
      </section>
    </div>
  );
};

export default LibraryPage;
