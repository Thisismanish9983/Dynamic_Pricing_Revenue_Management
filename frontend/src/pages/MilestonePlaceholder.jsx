import React from 'react';

export default function MilestonePlaceholder({ milestone, title, description, deliverables }) {
  return (
    <div className="page-wrapper" style={{ maxWidth: '860px' }}>
      <div className="card placeholder-card">
        <span className="milestone-badge">Scheduled for {milestone}</span>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '8px' }}>
          {title}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '600px', margin: '8px auto 0' }}>
          {description}
        </p>

        <div className="deliverables-grid">
          {deliverables?.map((item, index) => (
            <div key={index} className="deliverable-item">
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-dim)' }}>
          Milestone 1 (Foundation, Multi-Tenant Auth, RBAC & Dashboard Shell) is fully completed and operational in pure HTML/CSS/JS + React.
        </div>
      </div>
    </div>
  );
}
