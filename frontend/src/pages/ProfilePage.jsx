import React, { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { initialsForName } from '../lib/formatters';

const ProfilePage = () => {
  const { api, refreshUser, user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    avatar_url: '',
    bio: '',
  });
  const [people, setPeople] = useState([]);

  const loadPage = useCallback(async () => {
    try {
      const [profileResponse, peopleResponse] = await Promise.all([api.get('/auth/me'), api.get('/users')]);
      setForm({
        name: profileResponse.data.name || '',
        avatar_url: profileResponse.data.avatar_url || '',
        bio: profileResponse.data.bio || '',
      });
      setPeople(peopleResponse.data);
    } catch (error) {
      console.error('Failed to load profile page:', error);
    }
  }, [api]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      await api.patch('/auth/me', form);
      await refreshUser();
      await loadPage();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleAvatarUpload = (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, avatar_url: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const toggleFollow = async (person) => {
    try {
      if (person.is_following) {
        await api.delete(`/users/${person.id}/follow`);
      } else {
        await api.post(`/users/${person.id}/follow`);
      }
      setPeople((current) =>
        current.map((item) =>
          item.id === person.id
            ? {
                ...item,
                is_following: !item.is_following,
                follower_count: Math.max(0, item.follower_count + (item.is_following ? -1 : 1)),
              }
            : item,
        ),
      );
      await refreshUser();
    } catch (error) {
      console.error('Failed to update follow state:', error);
    }
  };

  return (
    <div className="page">
      <section className="classic-profile-header classic-profile-simple">
        {form.avatar_url ? (
          <img src={form.avatar_url} alt={user?.name} />
        ) : (
          <div className="profile-avatar-fallback">{initialsForName(user?.name)}</div>
        )}
        <div>
          <span className="eyebrow">Profile</span>
          <h1>{user?.name}</h1>
          <p>{user?.bio || 'Keep your profile simple, clean, and easy to recognize.'}</p>
          <div className="profile-stats">
            <span>{user?.follower_count || 0} followers</span>
            <span>{user?.following_count || 0} following</span>
          </div>
        </div>
      </section>

      <section className="dashboard-split">
        <div className="panel">
          <div className="section-header">
            <div>
              <h2>Edit profile</h2>
              <p>Keep it simple with just the details listeners need to see.</p>
            </div>
          </div>
          <form className="playlist-form" onSubmit={saveProfile}>
            <div className="profile-avatar-editor">
              <label className="upload-circle" htmlFor="profile-avatar-upload">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Profile preview" />
                ) : (
                  <div className="upload-placeholder">
                    <strong>Photo</strong>
                    <span>Browse</span>
                  </div>
                )}
                <input
                  id="profile-avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </label>
              <div className="muted-copy">
                Choose a small profile image from your computer.
              </div>
            </div>
            <label>
              <span>Display name</span>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label>
              <span>Short bio</span>
              <textarea value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
            </label>
            <button className="primary-button" type="submit">
              Save profile
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <h2>People to follow</h2>
              <p>Quick access to listeners you may want to follow.</p>
            </div>
          </div>
          <div className="compact-list">
            {people.map((person) => (
              <div key={person.id} className="compact-list-item">
                {person.avatar_url ? (
                  <img src={person.avatar_url} alt={person.name} />
                ) : (
                  <div className="mini-avatar">{initialsForName(person.name)}</div>
                )}
                <div>
                  <strong>{person.name}</strong>
                  <span>{person.follower_count} followers</span>
                </div>
                <button className="chip action-chip" type="button" onClick={() => toggleFollow(person)}>
                  {person.is_following ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
