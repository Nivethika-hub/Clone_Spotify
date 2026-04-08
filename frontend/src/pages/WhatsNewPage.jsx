import React, { useEffect, useState } from 'react';

import TrackRow from '../components/TrackRow';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { handleImageFallback, withFallbackArt } from '../lib/media';

const WhatsNewPage = () => {
  const { api } = useAuth();
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const [home, setHome] = useState(null);
  const [likedTrackIds, setLikedTrackIds] = useState([]);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const [homeResponse, libraryResponse] = await Promise.all([api.get('/browse/home'), api.get('/library')]);
        setHome(homeResponse.data);
        setLikedTrackIds(libraryResponse.data.liked_tracks.map((track) => track.id));
      } catch (error) {
        console.error("Failed to load what's new page:", error);
      }
    };

    loadPage();
  }, [api]);

  const newTracks = home?.featured_tracks || [];

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
      console.error("Failed to update likes on what's new page:", error);
    }
  };

  return (
    <div className="page">
      <section className="content-section">
        <div className="section-header">
          <div>
            <span className="eyebrow">What's New</span>
            <h2>Fresh Tamil updates</h2>
            <p>Latest highlights, featured tracks, and quick picks from your home feed.</p>
          </div>
        </div>
        <div className="track-table">
          {newTracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              isActive={currentTrack?.id === track.id}
              isPlaying={isPlaying}
              isLiked={likedTrackIds.includes(track.id)}
              onToggleLike={toggleLike}
              onPlay={(selectedTrack) => playTrack(selectedTrack, newTracks)}
            />
          ))}
        </div>
      </section>

      <section className="dashboard-split">
        {(home?.sections || []).slice(0, 2).map((section) => (
          <div className="panel" key={section.title}>
            <div className="section-header">
              <div>
                <h2>{section.title}</h2>
                <p>{section.subtitle}</p>
              </div>
            </div>
            <div className="compact-list">
              {section.tracks.slice(0, 4).map((track) => (
                <button
                  key={track.id}
                  className="compact-list-item clickable-track"
                  onClick={() => playTrack(track, section.tracks)}
                >
                  <img src={withFallbackArt(track.album?.cover_image)} alt={track.title} onError={handleImageFallback} />
                  <div>
                    <strong>{track.title}</strong>
                    <span>{track.artist?.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default WhatsNewPage;
