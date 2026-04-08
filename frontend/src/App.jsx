import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import AlbumPage from './pages/AlbumPage';
import ArtistPage from './pages/ArtistPage';
import LibraryPage from './pages/LibraryPage';
import FriendsActivityPage from './pages/FriendsActivityPage';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import PlaylistsPage from './pages/PlaylistsPage';
import PremiumPage from './pages/PremiumPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import Signup from './pages/Signup';
import WhatsNewPage from './pages/WhatsNewPage';
import './index.css';

const FullPageLoader = () => (
  <div className="centered-screen">
    <div className="loader-card">
      <div className="loader-orb" />
      <p>Loading your music space...</p>
    </div>
  </div>
);

const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
};

const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
};

const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Router>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route
              path="/login"
              element={
                <AuthRoute>
                  <Login />
                </AuthRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <AuthRoute>
                  <Signup />
                </AuthRoute>
              }
            />
            <Route path="/" element={<ProtectedLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="playlists" element={<PlaylistsPage />} />
              <Route path="playlists/:playlistId" element={<PlaylistDetailPage />} />
              <Route path="artists/:artistId" element={<ArtistPage />} />
              <Route path="albums/:albumId" element={<AlbumPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="whats-new" element={<WhatsNewPage />} />
              <Route path="friends-activity" element={<FriendsActivityPage />} />
              <Route path="premium" element={<PremiumPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </PlayerProvider>
    </AuthProvider>
  );
};

export default App;
