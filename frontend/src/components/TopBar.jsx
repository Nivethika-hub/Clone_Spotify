import React from 'react';
import { Bell, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { initialsForName } from '../lib/formatters';

const TopBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-nav">
        <button className="round-button" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
        </button>
        <button className="round-button" onClick={() => navigate(1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      <button className="topbar-search" onClick={() => navigate('/search')}>
        <Search size={18} />
        <span>What do you want to play?</span>
      </button>

      <div className="topbar-actions">
        <button className="premium-button" onClick={() => navigate('/premium')}>
          Explore Premium
        </button>
        <button className="round-button" onClick={() => navigate('/whats-new')} title="What's New">
          <Bell size={16} />
        </button>
        <button className="round-button" onClick={() => navigate('/friends-activity')} title="Friends Activity">
          <Users size={16} />
        </button>
        <button className="avatar-button" onClick={() => navigate('/profile')}>
          {user?.avatar_url ? <img src={user.avatar_url} alt={user.name} /> : initialsForName(user?.name)}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
