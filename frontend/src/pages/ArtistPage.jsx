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
  const { api } = useAuth();
  const { currentTrack, isPlaying, playCollection, playTrack } = usePlayer();
  const [artist, setArtist] = useState(null);
  const [saved, setSaved] = useState(false);
  const [likedTrackIds, setLikedTrackIds] = useState([]);

  useEffect(() => {
    const loadArtist = async () => {
      try {
        const [artistResponse, libraryResponse] = await Promise.all([
          api.get(`/artists/${artistId}`),
          api.get('/library'),
        ]);
        setArtist(artistResponse.data);
        setSaved(libraryResponse.data.saved_artists.some((item) => item.id === Number(artistId)));
        setLikedTrackIds(libraryResponse.data.liked_tracks.map((track) => track.id));
      } catch (error) {
        console.error('Failed to load artist:', error);
      }
    };

    loadArtist();
  }, [api, artistId]);

  if (!artist) {
    return <div className="page page-loading">Loading artist...</div>;
  }

  const toggleSaveArtist = async () => {
    try {
      if (saved) {
        await api.delete(`/library/artists/${artist.id}/save`);
        setSaved(false);
      } else {
        await api.post(`/library/artists/${artist.id}/save`);
        setSaved(true);
      }
    } catch (error) {
      console.error('Failed to update saved artist:', error);
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
            <button className="secondary-button" onClick={toggleSaveArtist}>
              <UserPlus size={16} />
              {saved ? 'Saved artist' : 'Save artist'}
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
              isLiked={likedTrackIds.includes(track.id)}
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
