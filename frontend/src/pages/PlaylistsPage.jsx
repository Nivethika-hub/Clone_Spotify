import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Trash2 } from 'lucide-react';

import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { handleImageFallback, withFallbackArt } from '../lib/media';

const initialForm = {
  title: '',
  description: '',
  is_public: true,
  cover_image: '',
};

const PlaylistsPage = () => {
  const { api } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [playlists, setPlaylists] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const loadPlaylists = useCallback(async () => {
    try {
      const response = await api.get('/playlists');
      setPlaylists(response.data);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  }, [api]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/playlists', form);
      setForm(initialForm);
      await loadPlaylists();
    } catch (error) {
      console.error('Failed to create playlist:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const deletePlaylist = async (playlistId) => {
    try {
      await api.delete(`/playlists/${playlistId}`);
      await loadPlaylists();
    } catch (error) {
      console.error('Failed to delete playlist:', error);
    }
  };

  return (
    <div className="page">
      <section className="dashboard-split">
        <div className="panel">
          <div className="section-header">
            <div>
              <h2>Create playlist</h2>
              <p>Build public or private playlists and manage them from here.</p>
            </div>
          </div>
          <form className="playlist-form" onSubmit={handleSubmit}>
            <label>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <div className="playlist-cover-upload">
              <span>Playlist cover</span>
              <label className="upload-circle">
                {form.cover_image ? (
                  <img src={form.cover_image} alt="Playlist cover preview" />
                ) : (
                  <div className="upload-placeholder">
                    <ImagePlus size={18} />
                    <small>Upload</small>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      setForm((current) => ({ ...current, cover_image: String(reader.result || '') }));
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
            <div className="privacy-toggle">
              <div>
                <strong>Playlist privacy</strong>
                <p>{form.is_public ? 'Anyone can view this playlist.' : 'Only you can view this playlist.'}</p>
              </div>
              <button
                type="button"
                className={`switch ${form.is_public ? 'on' : ''}`}
                onClick={() => setForm((current) => ({ ...current, is_public: !current.is_public }))}
                aria-label="Toggle playlist privacy"
              >
                <span />
              </button>
            </div>
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create playlist'}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <h2>Your playlists</h2>
              <p>Open any playlist to edit tracks or metadata.</p>
            </div>
          </div>
          <div className="playlist-stack">
            {playlists.length ? (
              playlists.map((playlist) => (
                <div key={playlist.id} className="playlist-card">
                  <img
                    src={withFallbackArt(playlist.cover_image || playlist.tracks?.[0]?.track?.album?.cover_image)}
                    alt={playlist.title}
                    onError={handleImageFallback}
                  />
                  <div>
                    <strong>{playlist.title}</strong>
                    <p>{playlist.description || 'No description yet.'}</p>
                    <span>{playlist.tracks.length} tracks</span>
                  </div>
                  <div className="playlist-card-actions">
                    <Link className="chip action-chip" to={`/playlists/${playlist.id}`}>
                      Open
                    </Link>
                    <button className="icon-button" onClick={() => deletePlaylist(playlist.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No playlists yet"
                description="Create your first playlist here and start adding songs from the playlist detail page."
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlaylistsPage;
