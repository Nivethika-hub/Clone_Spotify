import React, { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { initialsForName } from '../lib/formatters';

const FriendsActivityPage = () => {
  const { api } = useAuth();
  const [people, setPeople] = useState([]);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await api.get('/users');
        setPeople(response.data);
      } catch (error) {
        console.error('Failed to load friends activity:', error);
      }
    };

    loadPage();
  }, [api]);

  return (
    <div className="page">
      <section className="content-section">
        <div className="section-header">
          <div>
            <span className="eyebrow">Friends Activity</span>
            <h2>See what listeners are up to</h2>
            <p>Quick social view with follow actions and easy access to other listeners.</p>
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
              <div className="friend-activity-tag">{person.is_following ? 'Following' : 'Suggested'}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FriendsActivityPage;
