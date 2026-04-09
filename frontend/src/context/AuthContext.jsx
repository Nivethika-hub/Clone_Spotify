import React, { createContext, useContext, useEffect, useState } from 'react';

import { apiClient } from '../lib/api';

const AuthContext = createContext();
const TOKEN_KEY = 'spotify_clone_token';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const [authInFlight, setAuthInFlight] = useState(false);
  const [library, setLibrary] = useState(null);

  const refreshLibrary = async () => {
    if (!token) return;
    try {
      const response = await apiClient.get('/library');
      setLibrary(response.data);
    } catch (error) {
      console.error('Failed to fetch library:', error);
    }
  };

  const refreshUser = async () => {
    if (!token || authInFlight) return;
    setLoading(true);
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Only clear if it's a 401/403 (auth issue) not a network issue
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (track) => {
    if (!token) return;
    const isLiked = Boolean(library?.liked_tracks?.some((item) => item.id === track.id));
    try {
      if (isLiked) {
        await apiClient.delete(`/library/tracks/${track.id}/like`);
      } else {
        await apiClient.post(`/library/tracks/${track.id}/like`);
      }
      await refreshLibrary();
    } catch (error) {
      console.error('Failed to update liked track:', error);
    }
  };

  const toggleAlbumSave = async (album) => {
    if (!token) return;
    const isSaved = Boolean(library?.saved_albums?.some((item) => item.id === album.id));
    try {
      if (isSaved) {
        await apiClient.delete(`/library/albums/${album.id}/save`);
      } else {
        await apiClient.post(`/library/albums/${album.id}/save`);
      }
      await refreshLibrary();
    } catch (error) {
      console.error('Failed to update saved album:', error);
    }
  };

  const toggleArtistSave = async (artist) => {
    if (!token) return;
    const isSaved = Boolean(library?.saved_artists?.some((item) => item.id === artist.id));
    try {
      if (isSaved) {
        await apiClient.delete(`/library/artists/${artist.id}/save`);
      } else {
        await apiClient.post(`/library/artists/${artist.id}/save`);
      }
      await refreshLibrary();
    } catch (error) {
      console.error('Failed to update saved artist:', error);
    }
  };

  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) logout();
        return Promise.reject(error);
      }
    );

    if (!token) {
      delete apiClient.defaults.headers.common.Authorization;
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setLoading(false);
      return () => apiClient.interceptors.response.eject(interceptor);
    }

    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;

    if (!user && !authInFlight) {
      refreshUser();
      refreshLibrary();
    } else {
      setLoading(false);
    }

    return () => apiClient.interceptors.response.eject(interceptor);
  }, [token, user, authInFlight]);

  const authenticate = async (endpoint, payload) => {
    setAuthInFlight(true);
    setLoading(true);
    try {
      const response = await apiClient.post(endpoint, payload);
      const nextToken = response.data.access_token;
      
      localStorage.setItem(TOKEN_KEY, nextToken);
      apiClient.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
      
      const meResponse = await apiClient.get('/auth/me');
      
      // Update state together to minimize re-renders
      setToken(nextToken);
      setUser(meResponse.data);
      
      return { success: true, user: meResponse.data };
    } catch (error) {
      console.error('Authentication error:', error);
      const detail = error.response?.data?.detail;
      const errorMessage = Array.isArray(detail)
        ? detail.map(d => d.msg).join(', ')
        : detail || 'Authentication failed';

      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }

      return { success: false, error: errorMessage };
    } finally {
      setAuthInFlight(false);
      setLoading(false);
    }
  };

  const login = async (email, password) =>
    authenticate('/auth/login', { email: email.trim().toLowerCase(), password });

  const signup = async (email, password, name) =>
    authenticate('/auth/signup', {
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
    });

  const logout = () => {
    delete apiClient.defaults.headers.common.Authorization;
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        library,
        login,
        signup,
        logout,
        refreshUser,
        refreshLibrary,
        toggleLike,
        toggleAlbumSave,
        toggleArtistSave,
        api: apiClient,
        isAuthenticated: Boolean(user && token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
