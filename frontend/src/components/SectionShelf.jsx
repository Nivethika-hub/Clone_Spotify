import React from 'react';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handleImageFallback, withFallbackArt } from '../lib/media';
import { uniqueTracks } from '../lib/youtube';

const SectionShelf = ({ title, subtitle, items = [], onSelect, actionLabel = 'Show all' }) => {
  const navigate = useNavigate();
  const displayItems = uniqueTracks(items);

  const handleClick = (item) => {
    if (item.album && item.artist) {
      onSelect?.(item);
      return;
    }

    if (item.image_url) {
      navigate(`/artists/${item.id}`);
      return;
    }

    if (item.cover_image && item.artist) {
      navigate(`/albums/${item.id}`);
    }
  };

  return (
    <section className="content-section">
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <button className="section-link" onClick={() => navigate('/search')}>
          {actionLabel}
        </button>
      </div>
      <div className="card-grid">
        {displayItems.map((item, index) => (
          <button key={`${item.id}-${index}`} className="media-card" onClick={() => handleClick(item)}>
            <div className="media-card-image">
              <img
                src={withFallbackArt(item.album?.cover_image || item.cover_image || item.image_url)}
                alt={item.title || item.name}
                onError={handleImageFallback}
              />
              <span className="media-card-action">
                <Play size={18} fill="currentColor" />
              </span>
            </div>
            <strong>{item.title || item.name}</strong>
            <p>{item.artist?.name || item.genre || item.bio || item.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
};

export default SectionShelf;
