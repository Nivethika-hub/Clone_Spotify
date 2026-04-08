import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import TrackRow from '../components/TrackRow';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { handleImageFallback, withFallbackArt } from '../lib/media';

const PlaylistDetailPage = () => {
  const { playlistId } = useParams();
  const { api } = useAuth();
  const { currentTrack, isPlaying, playCollection, playTrack } = usePlayer();
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [likedTrackIds, setLikedTrackIds] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    is_public: true,
    cover_image: '',
  });

  const loadPage = useCallback(async () => {
    try {
      const [playlistResponse, tracksResponse] = await Promise.all([
        api.get(`/playlists/${playlistId}`),
        api.get('/tracks'),
      ]);
      const libraryResponse = await api.get('/library');
      setPlaylist(playlistResponse.data);
      setTracks(tracksResponse.data);
      setLikedTrackIds(libraryResponse.data.liked_tracks.map((track) => track.id));
      setForm({
        title: playlistResponse.data.title,
        description: playlistResponse.data.description || '',
        is_public: playlistResponse.data.is_public,
        cover_image: playlistResponse.data.cover_image || '',
      });
    } catch (error) {
      console.error('Failed to load playlist detail:', error);
    }
  }, [api, playlistId]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const savePlaylist = async (event) => {
    event.preventDefault();
    try {
      await api.patch(`/playlists/${playlistId}`, form);
      await loadPage();
    } catch (error) {
      console.error('Failed to update playlist:', error);
    }
  };

  const addTrack = async (track) => {
    try {
      await api.post(`/playlists/${playlistId}/tracks`, { track_id: track.id });
      await loadPage();
    } catch (error) {
      console.error('Failed to add track:', error);
    }
  };

  const removeTrack = async (playlistTrackId) => {
    try {
      await api.delete(`/playlists/${playlistId}/tracks/${playlistTrackId}`);
      await loadPage();
    } catch (error) {
      console.error('Failed to remove track:', error);
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
      console.error('Failed to update playlist track like state:', error);
    }
  };

  if (!playlist) {
    return <div className="page page-loading">Loading playlist...</div>;
  }

  const playlistTracks = playlist.tracks.map((item) => item.track);

  return (
    <div className="page">
      <section className="dashboard-split">
        <div className="panel">
          <div className="playlist-hero">
            <img
              src={withFallbackArt(playlist.cover_image || playlist.tracks?.[0]?.track?.album?.cover_image)}
              alt={playlist.title}
              onError={handleImageFallback}
            />
            <div>
              <span className="eyebrow">{playlist.is_public ? 'Public playlist' : 'Private playlist'}</span>
              <h1>{playlist.title}</h1>
              <p>{playlist.description || 'No description yet.'}</p>
              <button className="primary-button" onClick={() => playCollection(playlistTracks)}>
                Play playlist
              </button>
            </div>
          </div>

          <div className="track-table">
            {playlist.tracks.map((item, index) => (
              <div key={item.id} className="playlist-detail-row">
                <TrackRow
                  track={item.track}
                  index={index}
                  isActive={currentTrack?.id === item.track.id}
                  isPlaying={isPlaying}
                  isLiked={likedTrackIds.includes(item.track.id)}
                  onToggleLike={toggleLike}
                  onPlay={(track) => playTrack(track, playlistTracks)}
                />
                <button className="chip action-chip" onClick={() => removeTrack(item.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <h2>Edit playlist</h2>
              <p>Update metadata or add tracks from the catalog.</p>
            </div>
          </div>
          <form className="playlist-form" onSubmit={savePlaylist}>
            <label>
              <span>Title</span>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label>
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <label>
              <span>Cover image URL</span>
              <input
                value={form.cover_image}
                onChange={(event) => setForm((current) => ({ ...current, cover_image: event.target.value }))}
              />
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(event) => setForm((current) => ({ ...current, is_public: event.target.checked }))}
              />
              <span>Public playlist</span>
            </label>
            <button className="primary-button" type="submit">
              Save changes
            </button>
          </form>

          <div className="section-header narrow">
            <div>
              <h2>Add tracks</h2>
              <p>Tap a song to add it into this playlist.</p>
            </div>
          </div>
          <div className="catalog-picker">
            {tracks.map((track) => (
              <button key={track.id} className="catalog-picker-row" onClick={() => addTrack(track)}>
                <img src={withFallbackArt(track.album?.cover_image)} alt={track.title} onError={handleImageFallback} />
                <div>
                  <strong>{track.title}</strong>
                  <span>{track.artist?.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlaylistDetailPage;
