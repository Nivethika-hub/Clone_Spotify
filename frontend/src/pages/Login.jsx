import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-surface">
          <div className="auth-brand">
            <div className="auth-brand-mark">
              <div className="auth-brand-rings" />
            </div>
            <div>
              <span className="eyebrow">Spotify desktop inspired</span>
              <strong>Spotify Clone</strong>
            </div>
          </div>

          <div className="auth-hero-copy">
            <h1>Simple music access, right from the start.</h1>
            <p>
              Sign in and continue straight into a clean Tamil music dashboard with playlists,
              likes, and an easy Spotify-style layout.
            </p>
          </div>

          <div className="auth-simple-panel">
            <div className="auth-simple-dot" />
            <strong>Fast login</strong>
            <span>Open your dashboard without extra steps.</span>
          </div>
        </div>
      </div>

      <div className="auth-card">
        <h2>Welcome back</h2>
        <p>Log in to your music space.</p>

        {error ? <div className="error-banner">{error}</div> : null}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Email address</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button type="submit" className="primary-button auth-submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Need an account?</span>
          <Link to="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
