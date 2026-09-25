import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const roleMeta = {
  admin: {
    title: 'Admin',
    className: 'role-admin',
    desc: 'Manage organization settings, user permissions, products, and all pricing telemetry.',
  },
  revenue_manager: {
    title: 'Revenue Manager',
    className: 'role-revenue_manager',
    desc: 'Create and test pricing rules, review recommended rates, and approve/override rates.',
  },
  staff: {
    title: 'Staff / Operations',
    className: 'role-staff',
    desc: 'View products, adjust occupied units and daily room availability.',
  },
  viewer: {
    title: 'Viewer / Client',
    className: 'role-viewer',
    desc: 'Read-only access to pricing calendars, analytics dashboards, and export reports.',
  },
};

export default function UsersRoles() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'staff',
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/users');
      if (res.success) {
        setUsers(res.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!isAdmin) return;
    try {
      const res = await apiClient.put(`/users/${userId}`, { role: newRole });
      if (res.success) {
        setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      }
    } catch (e) {
      alert(e.message || 'Failed to update role');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    try {
      const res = await apiClient.post('/users', formData);
      if (res.success) {
        setMsg('User created successfully!');
        setFormData({ name: '', email: '', password: 'password123', role: 'staff' });
        fetchUsers();
        setTimeout(() => setShowModal(false), 1200);
      }
    } catch (e) {
      setErr(e.message || 'Failed to create user');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="card banner-card">
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>
            👥 Users & Role-Based Access Control (RBAC)
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Manage organization members and role permissions per the SaaS PRD specification.
          </p>
        </div>

        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Add Organization Member
          </button>
        )}
      </div>

      {/* Role Guide Cards */}
      <div className="grid-4">
        {Object.entries(roleMeta).map(([key, info]) => (
          <div key={key} className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className={`role-badge ${info.className}`}>{info.title}</span>
              <span style={{ fontSize: '14px' }}>🛡️</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {info.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
            Active Members ({users.length})
          </h3>
          {!isAdmin && (
            <span style={{ fontSize: '11px', color: 'var(--warning)' }}>
              🔒 Read-only view (Admin role required to modify assignments)
            </span>
          )}
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Reassign Role</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const badge = roleMeta[u.role] || roleMeta.viewer;
                const isSelf = u._id === currentUser?.id;
                return (
                  <tr key={u._id}>
                    <td style={{ fontWeight: '600', color: '#fff' }}>
                      {u.name} {isSelf && <span className="status-tag" style={{ marginLeft: '4px' }}>You</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge ${badge.className}`}>{badge.title}</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--success)', fontSize: '12px', fontWeight: '600' }}>
                        ● Active
                      </span>
                    </td>
                    <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Recent'}</td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        {isSelf ? (
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Owner</span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            <option value="admin">Admin</option>
                            <option value="revenue_manager">Revenue Manager</option>
                            <option value="staff">Staff / Ops</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setShowModal(false)} className="modal-close">×</button>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
              Add Team Member
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Create an account for your organization tenant.
            </p>

            {err && <div className="alert alert-danger">⚠️ {err}</div>}
            {msg && <div className="alert alert-success">✓ {msg}</div>}

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Rachel Adams"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="rachel@grandvista.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Assign Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="admin">Admin (Full Control)</option>
                  <option value="revenue_manager">Revenue Manager (Rules & Overrides)</option>
                  <option value="staff">Staff (Inventory & Availability)</option>
                  <option value="viewer">Viewer (Read-Only)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
