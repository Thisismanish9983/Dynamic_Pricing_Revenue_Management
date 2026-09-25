import React from 'react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', milestone: 'M1', path: '#/' },
  { id: 'products', label: 'Products & Inventory', icon: '📦', milestone: 'M2', path: '#/products' },
  { id: 'rules', label: 'Pricing Rules Engine', icon: '⚡', milestone: 'M2', path: '#/rules' },
  { id: 'calendar', label: 'Price Calendar', icon: '📅', milestone: 'M3', path: '#/calendar' },
  { id: 'recommendations', label: 'Rate Recommendations', icon: '✨', milestone: 'M3', path: '#/recommendations' },
  { id: 'analytics', label: 'Revenue Analytics', icon: '📈', milestone: 'M4', path: '#/analytics' },
  { id: 'notifications', label: 'Alerts & Notifications', icon: '🔔', milestone: 'M4', path: '#/notifications' },
  { id: 'users', label: 'Users & Roles (RBAC)', icon: '👥', milestone: 'M1', path: '#/users' },
  { id: 'settings', label: 'Organization Settings', icon: '⚙️', milestone: 'M1', path: '#/settings' },
];

export default function Sidebar({ currentRoute }) {
  return (
    <aside className="sidebar">
      <div>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon">📈</div>
          <div>
            <div className="brand-title">
              PRICEMATRIX <span className="brand-badge">SaaS</span>
            </div>
            <div className="brand-sub">Dynamic Pricing v1.0</div>
          </div>
        </div>

        {/* Nav Items */}
        <div className="sidebar-nav">
          <div className="nav-label">Management Console</div>
          {menuItems.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <a
                key={item.id}
                href={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-item-content">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <span className={`milestone-tag ${item.milestone === 'M1' ? 'active' : ''}`}>
                  {item.milestone}
                </span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="footer-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontWeight: '600', color: '#fff' }}>Milestone 1 Active</span>
            <span style={{ color: 'var(--success)' }}>●</span>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            Pure HTML/CSS/JS + React Frontend Architecture.
          </div>
        </div>
      </div>
    </aside>
  );
}
