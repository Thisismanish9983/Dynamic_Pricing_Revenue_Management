import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      window.location.hash = '#/dashboard';
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const [seeding, setSeeding] = useState(false);

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/seed-demo', {});
      await login('admin@grandvista.com', 'password123');
      window.location.hash = '#/dashboard';
    } catch (err) {
      setError(err.message || 'Failed to seed database. Check MONGODB_URI in Vercel.');
    } finally {
      setSeeding(false);
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setSubmitting(true);
    try {
      await login(demoEmail, 'password123');
      window.location.hash = '#/dashboard';
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('not found')) {
        setError('Demo database is empty! Click the "🌱 Initialize Demo Data" button below.');
      } else {
        setError(err.message || 'Demo login failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📈</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>
            Dynamic Pricing & Revenue Management
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Sign in to access your organization dashboard
          </p>
        </div>

        {error && <div className="alert alert-danger">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Work Email</label>
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {submitting ? 'Authenticating...' : 'Sign in to Console'}
          </button>
        </form>

        {/* Instant 1-Click Demo Logins */}
        <div className="demo-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff', textTransform: 'uppercase' }}>
              ✨ Instant Demo Role Logins
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
              pwd: password123
            </span>
          </div>

          <div className="demo-grid">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@grandvista.com')}
              className="demo-btn"
            >
              <div className="demo-btn-title">👑 Admin</div>
              <div className="demo-btn-desc">Full Organization Access</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('revenue@grandvista.com')}
              className="demo-btn"
            >
              <div className="demo-btn-title">📈 Revenue Mgr</div>
              <div className="demo-btn-desc">Rules & Overrides</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('staff@grandvista.com')}
              className="demo-btn"
            >
              <div className="demo-btn-title">🛎️ Staff / Ops</div>
              <div className="demo-btn-desc">Availability Updates</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('viewer@grandvista.com')}
              className="demo-btn"
            >
              <div className="demo-btn-title">👁️ Viewer</div>
              <div className="demo-btn-desc">Read-Only Analytics</div>
            </button>
          </div>

          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleSeedDatabase}
              disabled={seeding}
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px dashed rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontSize: '11px',
                padding: '7px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%',
                fontWeight: '500',
              }}
            >
              {seeding ? '🌱 Initializing Database...' : '🌱 Cloud Database Empty? 1-Click Initialize Demo Data'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Create a new organization?{' '}
          <a href="#/register" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: '600' }}>
            Register Organization
          </a>
          <div style={{ marginTop: '12px' }}>
            <a href="#/" style={{ color: 'var(--text-dim)', fontSize: '11px', textDecoration: 'none' }}>
              ← Back to Product Overview
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
