import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { PlayCircle, Clock, MoreHorizontal, Play } from 'lucide-react';

const Home = () => {
  const { api, user } = useAuth();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await api.get('/catalog/tracks');
        setTracks(response.data);
      } catch (error) {
        console.error('Failed to fetch tracks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, [api]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const sections = [
    { title: 'Recently Played', data: tracks.slice(0, 6) },
    { title: 'Recommended for you', data: tracks.slice(6, 12) },
    { title: 'Trending Now', data: tracks.slice(2, 10) },
  ];

  if (loading) {
    return (
      <div style={{ flex: 1, padding: '32px', backgroundColor: '#121212', minHeight: '100%' }}>
        <div style={{ height: '40px', width: '200px', backgroundColor: '#282828', borderRadius: '4px', marginBottom: '32px', animation: 'pulse 1.5s infinite' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ aspectRatio: '0.8', backgroundColor: '#282828', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#121212', background: 'linear-gradient(to bottom, #1e1e1e 0%, #121212 100%)', minHeight: '100%' }}>
      <div style={{ padding: '32px' }}>
        <header style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>{getGreeting()}, {user?.name}</h1>
        </header>

        {/* Hero Grid - Top 6 tracks */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '16px', 
          marginBottom: '40px' 
        }}>
          {tracks.slice(0, 6).map((track) => (
            <div
              key={`hero-${track.id}`}
              onClick={() => playTrack(track)}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '4px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                position: 'relative'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
              className="hero-card"
            >
              <div style={{ width: '80px', height: '80px', flexShrink: 0, boxShadow: '4px 0 12px rgba(0,0,0,0.3)' }}>
                <img 
                  src={track.album?.cover_image || 'https://via.placeholder.com/150'} 
                  alt="" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ padding: '0 16px', flex: 1, fontWeight: '700', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {track.title}
              </div>
              <button className="hero-play-button" style={{
                marginRight: '16px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                opacity: 0,
                transform: 'scale(0.8)',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
              }}>
                <Play fill="black" color="black" size={24} />
              </button>
            </div>
          ))}
        </div>

        {/* Regular Sections */}
        {sections.map((section, idx) => (
          <section key={idx} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', cursor: 'pointer' }} onMouseOver={(e) => e.target.style.textDecoration = 'underline'} onMouseOut={(e) => e.target.style.textDecoration = 'none'}>
                {section.title}
              </h2>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-subdued)', cursor: 'pointer' }} onMouseOver={(e) => e.target.style.textDecoration = 'underline'} onMouseOut={(e) => e.target.style.textDecoration = 'none'}>Show all</span>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
              gap: '24px' 
            }}>
              {section.data.map((track) => (
                <div
                  key={`${section.title}-${track.id}`}
                  className="track-card glass-panel"
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#282828')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => playTrack(track)}
                >
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '1', 
                    borderRadius: '6px', 
                    overflow: 'hidden', 
                    marginBottom: '16px', 
                    backgroundColor: '#333', 
                    position: 'relative',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}>
                    <img 
                      src={track.album?.cover_image || 'https://via.placeholder.com/150'} 
                      alt="" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <button style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      backgroundColor: 'var(--primary-accent)',
                      borderRadius: '50%',
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                      opacity: 0,
                      transition: 'all 0.3s ease',
                      transform: 'translateY(8px)'
                    }} className="play-button">
                      <Play fill="black" color="black" size={24} />
                    </button>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
                  <div style={{ color: 'var(--text-subdued)', fontSize: '14px', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {track.artist?.name}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <style>{`
        .hero-card:hover .hero-play-button {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
        .track-card:hover .play-button {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .track-card:hover {
          background-color: #282828 !important;
        }
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default Home;

