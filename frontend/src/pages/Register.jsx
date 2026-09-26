import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

export default function Register() {
  const [formData, setFormData] = useState({
    organizationName: '',
    industry: 'hotel',
    name: '',
    email: '',
    password: '',
    role: 'admin',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(formData);
      window.location.hash = '#/dashboard';
    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <BrandLogo size={46} showText={false} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Create Organization Account
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Set up multi-tenant dynamic pricing for your business
          </p>
        </div>

        {error && <div className="alert alert-danger">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Organization / Business Name</label>
            <input
              type="text"
              name="organizationName"
              required
              placeholder="e.g. Skyline Luxury Suites"
              value={formData.organizationName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Industry Domain</label>
            <select name="industry" value={formData.industry} onChange={handleChange}>
              <option value="hotel">Hotels & Hospitality</option>
              <option value="vacation_rental">Vacation Rentals</option>
              <option value="event_venue">Event Venues</option>
              <option value="parking">Parking Operations</option>
              <option value="rental_business">Equipment / Vehicle Rentals</option>
              <option value="other">Other Dynamic Pricing</option>
            </select>
          </div>

          <div className="form-group">
            <label>Your Full Name (Admin)</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Alex Johnson"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Work Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="admin@skyline.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {submitting ? 'Creating Tenant...' : 'Initialize Organization'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <a href="#/login" style={{ color: 'var(--gold-primary)', textDecoration: 'none', fontWeight: '600' }}>
            Sign in
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
