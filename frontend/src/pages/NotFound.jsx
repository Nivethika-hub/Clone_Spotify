import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="centered-screen">
    <div className="loader-card">
      <h1>Page not found</h1>
      <p>The route you tried does not exist in this Spotify clone.</p>
      <Link className="primary-button" to="/dashboard">
        Go to dashboard
      </Link>
    </div>
  </div>
);

export default NotFound;
