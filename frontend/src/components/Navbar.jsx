import React from 'react';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  admin: { name: 'Admin', className: 'role-admin' },
  revenue_manager: { name: 'Revenue Manager', className: 'role-revenue_manager' },
  staff: { name: 'Staff / Operations', className: 'role-staff' },
  viewer: { name: 'Viewer (Read-Only)', className: 'role-viewer' },
};

export default function Navbar() {
  const { user, organization, logout } = useAuth();
  const currentRole = roleLabels[user?.role] || roleLabels.viewer;

  return (
    <header className="navbar">
      {/* Left: Organization & Multi-Tenant Info */}
      <div className="nav-left">
        <div className="tenant-icon">🏢</div>
        <div>
          <div className="tenant-name-row">
            <span className="tenant-title">{organization?.name || 'Grand Vista Boutique Hotel'}</span>
            <span className="status-tag">Tenant Active</span>
          </div>
          <div className="tenant-meta">
            Domain: {organization?.industry?.replace('_', ' ') || 'Hospitality'} • Currency: {organization?.currency || 'USD'}
          </div>
        </div>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="nav-right">
        {/* Role Badge */}
        <span className={`role-badge ${currentRole.className}`}>
          🛡️ {currentRole.name}
        </span>

        {/* User Info */}
        <div style={{ textAlign: 'right', fontSize: '12px' }}>
          <div style={{ fontWeight: '600', color: '#fff' }}>{user?.name}</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{user?.email}</div>
        </div>

        {/* Sign Out Button */}
        <button onClick={logout} className="btn-signout">
          Sign out
        </button>
      </div>
    </header>
  );
}
