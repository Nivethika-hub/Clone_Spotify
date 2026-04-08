import React, { useEffect, useState } from 'react';
import { Expand, Heart, MoreHorizontal, Pause, Play, SkipBack, SkipForward } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../lib/formatters';
import { handleImageFallback, withFallbackArt } from '../lib/media';
import { uniqueTracks } from '../lib/youtube';

const NowPlayingPanel = () => {
  const { api } = useAuth();
  const { currentTrack, progress, duration, queueTrackIds, playTrack, isPlaying, nextTrack, previousTrack, togglePlay, seek } = usePlayer();
  const [library, setLibrary] = useState({ liked_tracks: [], recently_played: [] });
  const [catalogTracks, setCatalogTracks] = useState([]);
  const [browseHome, setBrowseHome] = useState({ made_for_you: [] });

  useEffect(() => {
    const loadPanelData = async () => {
      try {
        const [libraryResponse, tracksResponse, browseResponse] = await Promise.all([
          api.get('/library'),
          api.get('/tracks'),
          api.get('/browse/home'),
        ]);
        setLibrary(libraryResponse.data);
        setCatalogTracks(tracksResponse.data);
        setBrowseHome(browseResponse.data);
      } catch (error) {
        console.error('Failed to load now-playing context:', error);
      }
    };

    loadPanelData();
  }, [api, currentTrack?.id]);

  const queueRecommendations = queueTrackIds
    .map((trackId) => catalogTracks.find((track) => track.id === trackId))
    .filter(Boolean)
    .filter((track) => track.id !== currentTrack?.id);

  const recommendedTracks = uniqueTracks(queueRecommendations.length ? queueRecommendations : browseHome.made_for_you)
    .filter((track) => track.id !== currentTrack?.id)
    .slice(0, 4);

  const likedTracks = uniqueTracks(library.liked_tracks).filter((track) => track.id !== currentTrack?.id).slice(0, 3);

  const playFromPanel = (track) => {
    if (!track) {
      return;
    }
    playTrack(track, catalogTracks.length ? catalogTracks : [track]);
  };

  const toggleLike = async (track) => {
    const isLiked = library.liked_tracks.some((item) => item.id === track.id);
    try {
      if (isLiked) {
        await api.delete(`/library/tracks/${track.id}/like`);
      } else {
        await api.post(`/library/tracks/${track.id}/like`);
      }
      const libraryResponse = await api.get('/library');
      setLibrary(libraryResponse.data);
    } catch (error) {
      console.error('Failed to update liked songs from panel:', error);
    }
  };

  const isCurrentLiked = currentTrack ? library.liked_tracks.some((track) => track.id === currentTrack.id) : false;

  return (
    <aside className="now-playing-panel">
      <div className="now-playing-header">
        <strong>{currentTrack?.artist?.name || 'Now playing'}</strong>
        <div className="now-playing-tools">
          <button className="icon-button">
            <MoreHorizontal size={16} />
          </button>
          <button className="icon-button">
            <Expand size={16} />
          </button>
        </div>
      </div>

      <div className="now-playing-card">
        <img
          className="now-playing-cover"
          src={withFallbackArt(currentTrack?.album?.cover_image)}
          alt={currentTrack?.title || 'Selected track'}
          onError={handleImageFallback}
        />
        <div className="now-playing-copy">
          <h3>{currentTrack?.title || 'Choose a track from the dashboard'}</h3>
          <p>{currentTrack?.artist?.name || 'Your selected song details will appear here.'}</p>
        </div>
        {currentTrack ? (
          <div className="now-playing-actions">
            <button className="icon-button" onClick={previousTrack} type="button">
              <SkipBack size={16} />
            </button>
            <button className="primary-player-button panel-play-button" onClick={togglePlay} type="button">
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <button className="icon-button" onClick={nextTrack} type="button">
              <SkipForward size={16} />
            </button>
            <button
              className={`icon-button ${isCurrentLiked ? 'active' : ''}`}
              onClick={() => toggleLike(currentTrack)}
              type="button"
            >
              <Heart size={16} fill={isCurrentLiked ? 'currentColor' : 'none'} />
            </button>
          </div>
        ) : null}
        <div className="now-playing-progress">
          <span>{formatDuration(progress)}</span>
          <div className="progress-rail">
            <input
              className="panel-progress-input"
              type="range"
              min="0"
              max={duration || 0}
              value={progress}
              onChange={(event) => seek(Number(event.target.value))}
            />
            <div className="progress-fill" style={{ width: `${duration ? Math.min((progress / duration) * 100, 100) : 0}%` }} />
          </div>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      <div className="panel-block">
        <h4>Liked in your library</h4>
        <div className="mini-track-list">
          {likedTracks.map((track) => (
            <button key={track.id} className="mini-track-item clickable-track" onClick={() => playFromPanel(track)}>
              <img src={withFallbackArt(track.album?.cover_image)} alt={track.title} onError={handleImageFallback} />
              <div>
                <strong>{track.title}</strong>
                <span>{track.artist?.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-block">
        <h4>Recommended next songs</h4>
        <div className="mini-track-list">
          {recommendedTracks.map((track) => (
            <button key={track.id} className="mini-track-item clickable-track" onClick={() => playFromPanel(track)}>
              <img src={withFallbackArt(track.album?.cover_image)} alt={track.title} onError={handleImageFallback} />
              <div>
                <strong>{track.title}</strong>
                <span>{track.artist?.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default NowPlayingPanel;
