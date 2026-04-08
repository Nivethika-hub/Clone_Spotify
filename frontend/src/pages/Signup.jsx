import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signup(email, password, name);
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
            <h1>Create your account and enter directly.</h1>
            <p>
              Start with a simple profile, a ready Tamil starter library, and a clean interface
              that stays light and easy to use.
            </p>
          </div>

          <div className="auth-simple-panel">
            <div className="auth-simple-dot" />
            <strong>Quick setup</strong>
            <span>Signup once and move straight into the dashboard.</span>
          </div>
        </div>
      </div>

      <div className="auth-card">
        <h2>Create account</h2>
        <p>Build your profile and start your library.</p>

        {error ? (
          <div className="error-banner">
            {error}
            {error.includes('Email already registered') && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9em' }}>
                Maybe you meant to <Link to="/login" style={{ color: 'inherit', textDecoration: 'underline' }}>Log in</Link>?
              </div>
            )}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Name</span>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>

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
              minLength="6"
              required
            />
          </label>

          <button type="submit" className="primary-button auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already joined?</span>
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
