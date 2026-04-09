import React from 'react';
import { Home, Library, ListMusic, LogOut, Search, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { initialsForName } from '../lib/formatters';

const Sidebar = () => {
  const { logout, user, library } = useAuth();

  const menuItems = [
    { label: 'Dashboard', icon: <Home />, path: '/dashboard' },
    { label: 'Search', icon: <Search />, path: '/search' },
    { 
      label: `Your Library ${library?.liked_tracks?.length ? `(${library.liked_tracks.length})` : ''}`, 
      icon: <Library />, 
      path: '/library' 
    },
    { label: 'Playlists', icon: <ListMusic />, path: '/playlists' },
    { label: 'Profile', icon: <UserRound />, path: '/profile' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-icon-rail">
        <nav className="sidebar-mini-nav">
          {menuItems.map((item) => (
            <NavLink
              key={`mini-${item.path}`}
              to={item.path}
              className={({ isActive }) => `mini-nav-link ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              {React.cloneElement(item.icon, { size: 18 })}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom-actions">
          <NavLink to="/profile" className="mini-nav-link" title="Profile">
            {user?.avatar_url ? (
              <img className="mini-avatar-image" src={user.avatar_url} alt={user.name} />
            ) : (
              <span className="mini-avatar-text">{initialsForName(user?.name)}</span>
            )}
          </NavLink>
          <button className="mini-nav-link logout-mini" onClick={logout} title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
