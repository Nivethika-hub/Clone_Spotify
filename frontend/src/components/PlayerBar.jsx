import React from 'react';
import { Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2 } from 'lucide-react';

import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../lib/formatters';
import { handleImageFallback, withFallbackArt } from '../lib/media';

const PlayerBar = () => {
  const {
    currentTrack,
    cycleRepeatMode,
    duration,
    isPlaying,
    nextTrack,
    previousTrack,
    progress,
    repeatMode,
    seek,
    setVolume,
    shuffleEnabled,
    togglePlay,
    toggleShuffle,
    volume,
  } = usePlayer();

  if (!currentTrack) {
    return (
      <div className="player-bar empty">
        <div>
          <strong>Pick something to play</strong>
          <p>Your queue will appear here once you start listening.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="player-bar">
      <div className="player-track">
        <img src={withFallbackArt(currentTrack.album?.cover_image)} alt={currentTrack.title} onError={handleImageFallback} />
        <div>
          <strong>{currentTrack.title}</strong>
          <p>{currentTrack.artist?.name}</p>
        </div>
      </div>

      <div className="player-controls">
        <div className="player-buttons">
          <button className={`icon-button ${shuffleEnabled ? 'active' : ''}`} onClick={toggleShuffle}>
            <Shuffle size={16} />
          </button>
          <button className="icon-button" onClick={previousTrack}>
            <SkipBack size={18} />
          </button>
          <button className="primary-player-button" onClick={togglePlay}>
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button className="icon-button" onClick={nextTrack}>
            <SkipForward size={18} />
          </button>
          <button className={`icon-button ${repeatMode !== 'off' ? 'active' : ''}`} onClick={cycleRepeatMode}>
            <Repeat size={16} />
          </button>
        </div>

        <div className="player-scrubber">
          <span>{formatDuration(progress)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={progress}
            onChange={(event) => seek(Number(event.target.value))}
          />
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      <div className="player-volume">
        <Volume2 size={16} />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
      </div>
    </div>
  );
};

export default PlayerBar;
