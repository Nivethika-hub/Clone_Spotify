import React from 'react';
import { Heart, PauseCircle, PlayCircle, Plus } from 'lucide-react';

import { formatDuration } from '../lib/formatters';
import { handleImageFallback, withFallbackArt } from '../lib/media';

const TrackRow = ({
  track,
  index,
  isActive,
  isPlaying,
  isLiked = false,
  onPlay,
  onToggleLike,
  onAdd,
}) => (
  <div className={`track-row ${isActive ? 'active' : ''}`}>
    <button className="track-row-play" onClick={() => onPlay?.(track)}>
      {isActive && isPlaying ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
    </button>
    <div className="track-row-index">{String(index + 1).padStart(2, '0')}</div>
    <div className="track-row-cover">
      <img src={withFallbackArt(track.album?.cover_image)} alt={track.title} onError={handleImageFallback} />
    </div>
    <div className="track-row-meta">
      <strong>{track.title}</strong>
      <span>{track.artist?.name}</span>
    </div>
    <div className="track-row-album">{track.album?.title}</div>
    <div className="track-row-actions">
      {onToggleLike ? (
        <button className={`icon-button ${isLiked ? 'active' : ''}`} onClick={() => onToggleLike(track)}>
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      ) : null}
      {onAdd ? (
        <button className="icon-button" onClick={() => onAdd(track)}>
          <Plus size={16} />
        </button>
      ) : null}
      <span className="track-row-duration">{formatDuration(track.duration_seconds)}</span>
    </div>
  </div>
);

export default TrackRow;
