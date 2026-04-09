import React, { useCallback, useEffect, useState } from 'react';

import EmptyState from '../components/EmptyState';
import TrackRow from '../components/TrackRow';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { handleImageFallback, withFallbackArt } from '../lib/media';

const LibraryPage = () => {
  const { api, library, loading: authLoading, toggleLike, toggleAlbumSave, toggleArtistSave, refreshLibrary } = useAuth();
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  
  useEffect(() => {
    if (!library) {
      refreshLibrary();
    }
  }, [library, refreshLibrary]);

  if (authLoading || (!library && !authLoading)) {
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
                  <button
                    className={`icon-button active`}
                    onClick={() => toggleAlbumSave(album)}
                    title="Remove from library"
                  >
                    <Heart size={16} fill="currentColor" />
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
                  <button
                    className={`icon-button active`}
                    onClick={() => toggleArtistSave(artist)}
                    title="Unfollow artist"
                  >
                    <Heart size={16} fill="currentColor" />
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
