import React from 'react';
import BrandLogo from './BrandLogo';
import {
  IconDashboard,
  IconProducts,
  IconRules,
  IconCalendar,
  IconRecommendations,
  IconAnalytics,
  IconNotifications,
  IconUsers,
  IconSettings
} from './Icons';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', Icon: IconDashboard, milestone: 'M1', path: '#/' },
  { id: 'products', label: 'Products & Inventory', Icon: IconProducts, milestone: 'M2', path: '#/products' },
  { id: 'rules', label: 'Pricing Rules Engine', Icon: IconRules, milestone: 'M2', path: '#/rules' },
  { id: 'calendar', label: 'Price Calendar', Icon: IconCalendar, milestone: 'M3', path: '#/calendar' },
  { id: 'recommendations', label: 'Rate Recommendations', Icon: IconRecommendations, milestone: 'M3', path: '#/recommendations' },
  { id: 'analytics', label: 'Revenue Analytics', Icon: IconAnalytics, milestone: 'M4', path: '#/analytics' },
  { id: 'notifications', label: 'Alerts & Notifications', Icon: IconNotifications, milestone: 'M4', path: '#/notifications' },
  { id: 'users', label: 'Users & Roles (RBAC)', Icon: IconUsers, milestone: 'M1', path: '#/users' },
  { id: 'settings', label: 'Organization Settings', Icon: IconSettings, milestone: 'M1', path: '#/settings' },
];

export default function Sidebar({ currentRoute }) {
  return (
    <aside className="sidebar">
      <div>
        {/* Brand */}
        <div className="sidebar-brand">
          <BrandLogo size={36} showSubtitle={true} />
        </div>

        {/* Nav Items */}
        <div className="sidebar-nav">
          <div className="nav-label">Management Console</div>
          {menuItems.map((item) => {
            const isActive = currentRoute === item.id;
            const ItemIcon = item.Icon;
            return (
              <a
                key={item.id}
                href={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-item-content">
                  <span className="nav-icon-wrapper" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <ItemIcon size={17} color={isActive ? 'var(--gold-primary)' : 'var(--text-muted)'} />
                  </span>
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
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Milestone 1 Active</span>
            <span style={{ color: 'var(--emerald)', fontSize: '10px' }}>● Live</span>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            Enterprise Multi-Tenant SaaS Console
          </div>
        </div>
      </div>
    </aside>
  );
}
