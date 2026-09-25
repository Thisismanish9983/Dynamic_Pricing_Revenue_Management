import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('hotels');

  const industryDetails = {
    hotels: {
      title: 'Hotels & Boutique Resorts',
      badge: 'Hospitality',
      desc: 'Automatically increase room rates during high-demand weekends, festivals, and last-minute booking surges while offering smart discounts during mid-week lulls.',
      metrics: '+28% Average RevPAR Increase',
      sample: 'Deluxe Ocean View: $180 Base ➔ $228 Peak Surge (+26.6%)',
    },
    rentals: {
      title: 'Vacation Rentals & Airbnb Portfolios',
      badge: 'Short-Term Rentals',
      desc: 'Eliminate manual calendar adjustments across multiple properties with seasonal multipliers, holiday pricing, and lead-time demand curves.',
      metrics: '+22% Portfolio Revenue Lift',
      sample: 'Mountain Villa: $250 Base ➔ $340 Holiday Weekend (+36%)',
    },
    venues: {
      title: 'Event Venues & Conference Halls',
      badge: 'Venues & Spaces',
      desc: 'Price hourly or daily venue slots dynamically based on prime time slots, wedding seasons, corporate booking windows, and remaining capacity.',
      metrics: '89% Prime Slot Occupancy',
      sample: 'Grand Ballroom: $1,200 Base ➔ $1,850 Prime Saturday (+54%)',
    },
    parking: {
      title: 'Parking Operators & Fleets',
      badge: 'Mobility & Operations',
      desc: 'Real-time tariff adjustments reacting to lot occupancy percentages, airport flight schedules, and surrounding event traffic.',
      metrics: '+31% Yield Optimization',
      sample: 'Daily Terminal Lot: $20 Base ➔ $34 High Demand (+70%)',
    },
  };

  const currentInd = industryDetails[activeTab];

  return (
    <div className="landing-container">
      {/* 1. Global Navigation Bar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <a href="#/" className="landing-brand">
            <div className="landing-brand-logo">📈</div>
            <div>
              <span className="landing-brand-title">PRICEMATRIX</span>
              <span className="landing-brand-badge">SaaS</span>
            </div>
          </a>

          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#industries">Industries</a>
            <a href="#rules-engine">Rules Engine</a>
          </div>

          <div className="landing-nav-actions">
            {user ? (
              <a href="#/dashboard" className="btn-primary">
                Go to Console ➔
              </a>
            ) : (
              <>
                <a href="#/login" className="btn-secondary">
                  Sign In
                </a>
                <a href="#/register" className="btn-primary">
                  Get Started Free
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-pill">
            <span className="hero-pill-sparkle">✨</span>
            <span>Intelligent Dynamic Pricing & Revenue Optimization</span>
          </div>

          <h1 className="hero-title">
            Maximize Revenue Automatically with{' '}
            <span className="hero-gradient-text">Algorithmic Dynamic Pricing</span>
          </h1>

          <p className="hero-subtitle">
            Stop losing revenue to fixed prices. Our multi-tenant SaaS platform automatically calculates, 
            recommends, and deploys optimal rates based on real-time occupancy, demand surges, seasonality, 
            and customizable safety guardrails.
          </p>

          <div className="hero-cta-group">
            <a href="#/register" className="btn-primary btn-large">
              Start Free Trial ➔
            </a>
            <a href="#/login" className="btn-secondary btn-large">
              Explore Live Demo
            </a>
          </div>

          <div className="hero-trust">
            <span>✓ Multi-tenant Architecture</span>
            <span>✓ Strict Floor & Ceiling Price Limits</span>
            <span>✓ Revenue Manager Review & Overrides</span>
            <span>✓ Full Audit Logging</span>
          </div>
        </div>

        {/* Hero Interactive Telemetry Preview Card */}
        <div className="hero-mockup-wrapper">
          <div className="mockup-header">
            <div className="mockup-dots">
              <span style={{ backgroundColor: '#ef4444' }}></span>
              <span style={{ backgroundColor: '#f59e0b' }}></span>
              <span style={{ backgroundColor: '#10b981' }}></span>
            </div>
            <div className="mockup-title">PRICEMATRIX Operations Console • Live Telemetry</div>
            <span className="status-tag">Engine Online</span>
          </div>

          <div className="mockup-body">
            <div className="mockup-grid">
              <div className="mockup-stat">
                <span className="stat-label">Projected Monthly Revenue</span>
                <span className="stat-val">$310,350</span>
                <span className="stat-sub text-emerald">↑ +12.8% vs last month</span>
              </div>
              <div className="mockup-stat">
                <span className="stat-label">Portfolio Occupancy</span>
                <span className="stat-val">62%</span>
                <span className="stat-sub text-gold">56 / 90 Units Active</span>
              </div>
              <div className="mockup-stat">
                <span className="stat-label">Average Rate (ADR)</span>
                <span className="stat-val">$254</span>
                <span className="stat-sub">Dynamically adjusted</span>
              </div>
              <div className="mockup-stat">
                <span className="stat-label">Active Price Surges</span>
                <span className="stat-val">8 Rules</span>
                <span className="stat-sub text-emerald">✓ Safety clamped</span>
              </div>
            </div>

            <div className="mockup-row">
              <div>
                <div style={{ fontWeight: '700', color: '#fff', fontSize: '13px' }}>
                  Deluxe Ocean View King Room
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Occupancy: 84% • High Demand Triggered
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-dim)', fontSize: '11px', marginRight: '8px' }}>
                  $180 Base
                </span>
                <span style={{ color: 'var(--gold-light)', fontWeight: '800', fontSize: '15px' }}>
                  $220 Current (+22%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Platform Key Metrics Bar */}
      <section className="stats-bar">
        <div className="stats-bar-inner">
          <div className="stat-item">
            <div className="stat-number">+24%</div>
            <div className="stat-caption">Average Revenue Uplift</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">&lt; 100ms</div>
            <div className="stat-caption">Rate Calculation Latency</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-caption">Floor & Ceiling Protection</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">4 Roles</div>
            <div className="stat-caption">Admin, Rev. Mgr, Staff, Viewer</div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Section */}
      <section id="features" className="landing-section">
        <div className="section-header">
          <span className="section-pill">Features Overview</span>
          <h2 className="section-title">Everything You Need to Automate Pricing</h2>
          <p className="section-subtitle">
            A comprehensive operations suite built for businesses whose revenue depends on real-time availability and market demand.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Dynamic Pricing Rules Engine</h3>
            <p className="feature-desc">
              Create rules like <em>"If occupancy &gt; 80%, increase price by 15%"</em> or <em>"Weekend demand +20%"</em>. 
              The engine automatically calculates new rates without manual calculation.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3 className="feature-title">Interactive Price Calendar</h3>
            <p className="feature-desc">
              Visualize rates across dates and inventory in a clear matrix. Compare standard base prices 
              against recommended surge rates, and apply manual overrides with one click.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3 className="feature-title">Manager Review & Safety Limits</h3>
            <p className="feature-desc">
              Never worry about runaway pricing. Configure hard minimum price floors and maximum price ceilings. 
              Optionally require Revenue Manager review before prices are published.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3 className="feature-title">AI Insights & Anomaly Alerts</h3>
            <p className="feature-desc">
              Identifies sudden demand spikes (e.g. occupancy jumping without price adjustments) and generates 
              clear explanatory recommendations to optimize RevPAR.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏢</div>
            <h3 className="feature-title">Multi-Tenant Data Isolation</h3>
            <p className="feature-desc">
              Every organization has isolated data scoping, dedicated settings, and custom currency/timezone 
              preferences with strict tenant data security.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3 className="feature-title">Role-Based Access Control (RBAC)</h3>
            <p className="feature-desc">
              Fine-grained permissions for Admins, Revenue Managers, Front Desk/Operations Staff, 
              and Read-Only Client Viewers.
            </p>
          </div>
        </div>
      </section>

      {/* 5. How It Works 3-Step Section */}
      <section id="how-it-works" className="landing-section bg-alt">
        <div className="section-header">
          <span className="section-pill">Simple Workflow</span>
          <h2 className="section-title">How Dynamic Pricing Works in 3 Steps</h2>
          <p className="section-subtitle">
            From setup to automated rate adjustments in minutes.
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-badge">Step 1</div>
            <h3 className="step-title">Add Inventory & Base Rates</h3>
            <p className="step-desc">
              Define your products (rooms, suites, parking slots, venues), base prices, capacity, and set safe min/max price boundaries.
            </p>
          </div>

          <div className="step-card">
            <div className="step-badge">Step 2</div>
            <h3 className="step-title">Configure Pricing Rules</h3>
            <p className="step-desc">
              Set occupancy thresholds, weekend premiums, and seasonal dates. The system evaluates demand conditions continuously.
            </p>
          </div>

          <div className="step-card">
            <div className="step-badge">Step 3</div>
            <h3 className="step-title">Review, Approve & Profit</h3>
            <p className="step-desc">
              Managers can inspect recommendations on the Price Calendar, override when needed, or enable auto-publish to maximize daily revenue.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Industries Showcase Tab Section */}
      <section id="industries" className="landing-section">
        <div className="section-header">
          <span className="section-pill">Industry Solutions</span>
          <h2 className="section-title">Tailored for Every Demand-Driven Business</h2>
          <p className="section-subtitle">
            Whether you run a boutique hotel, vacation rental fleet, or parking network.
          </p>
        </div>

        <div className="industry-tabs">
          <button
            className={`industry-tab ${activeTab === 'hotels' ? 'active' : ''}`}
            onClick={() => setActiveTab('hotels')}
          >
            🏨 Hotels & Resorts
          </button>
          <button
            className={`industry-tab ${activeTab === 'rentals' ? 'active' : ''}`}
            onClick={() => setActiveTab('rentals')}
          >
            🏡 Vacation Rentals
          </button>
          <button
            className={`industry-tab ${activeTab === 'venues' ? 'active' : ''}`}
            onClick={() => setActiveTab('venues')}
          >
            🎪 Event Venues
          </button>
          <button
            className={`industry-tab ${activeTab === 'parking' ? 'active' : ''}`}
            onClick={() => setActiveTab('parking')}
          >
            🅿️ Parking Operations
          </button>
        </div>

        <div className="industry-content-card">
          <div className="ind-header">
            <div>
              <span className="status-tag">{currentInd.badge}</span>
              <h3 className="ind-title">{currentInd.title}</h3>
            </div>
            <div className="ind-metric">{currentInd.metrics}</div>
          </div>
          <p className="ind-desc">{currentInd.desc}</p>
          <div className="ind-sample">
            <span style={{ fontWeight: '700', color: 'var(--gold-light)' }}>Dynamic Example:</span>{' '}
            <span>{currentInd.sample}</span>
          </div>
        </div>
      </section>

      {/* 7. Call To Action Footer Banner */}
      <section className="landing-cta-banner">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to Automate Your Revenue Management?</h2>
          <p className="cta-subtitle">
            Create your organization tenant in 30 seconds and test dynamic pricing with our pre-populated demo data.
          </p>
          <div className="hero-cta-group" style={{ justifyContent: 'center', marginTop: '24px' }}>
            <a href="#/register" className="btn-primary btn-large">
              Create Organization Tenant ➔
            </a>
            <a href="#/login" className="btn-secondary btn-large">
              Login to Demo Accounts
            </a>
          </div>
        </div>
      </section>

      {/* 8. Global Landing Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-col">
            <div className="landing-brand">
              <div className="landing-brand-logo">📈</div>
              <span className="landing-brand-title">PRICEMATRIX SaaS</span>
            </div>
            <p className="footer-about">
              Enterprise Multi-Tenant Dynamic Pricing & Revenue Optimization platform. Built per the official SaaS PRD specifications.
            </p>
          </div>

          <div className="footer-col">
            <div className="footer-heading">Platform</div>
            <a href="#features">Dynamic Rules Engine</a>
            <a href="#features">Price Calendar</a>
            <a href="#features">Safety Boundaries</a>
            <a href="#features">AI Recommendations</a>
          </div>

          <div className="footer-col">
            <div className="footer-heading">Access</div>
            <a href="#/login">Sign In</a>
            <a href="#/register">Register Tenant</a>
            <a href="#/login">Demo Logins (Admin / Mgr)</a>
          </div>

          <div className="footer-col">
            <div className="footer-heading">Architecture</div>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
              Frontend: Pure HTML5, CSS3, Native JS, React<br />
              Backend: Node.js, Express.js REST API<br />
              Database: MongoDB Multi-Tenant Isolation
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© 2026 PRICEMATRIX Technologies Ltd. All rights reserved.</div>
          <div style={{ color: 'var(--text-dim)' }}>Dynamic Pricing & Revenue Management System</div>
        </div>
      </footer>
    </div>
  );
}
