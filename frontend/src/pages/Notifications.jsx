import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import {
  IconNotifications,
  IconShield,
  IconTrendingUp,
  IconDollar,
} from '../components/Icons';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [alertPreferences, setAlertPreferences] = useState({
    surgeAlerts: true,
    guardrailBreaches: true,
    lowOccupancyPromos: true,
    dailyDigest: false,
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let endpoint = '/notifications';
      if (activeTab === 'unread') {
        endpoint += '?read=false';
      } else if (activeTab !== 'all') {
        endpoint += `?type=${activeTab}`;
      }

      const res = await apiClient.get(endpoint);
      if (res.success) {
        setNotifications(res.notifications || []);
        if (res.unreadCount !== undefined) setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await apiClient.patch(`/notifications/${id}/read`, {});
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      alert(err.message || 'Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await apiClient.patch('/notifications/read-all', {});
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      alert(err.message || 'Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const res = await apiClient.delete(`/notifications/${id}`);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      const res = await apiClient.delete('/notifications');
      if (res.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      alert(err.message || 'Failed to clear notifications');
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return {
          bg: 'var(--rose-bg)',
          color: 'var(--rose)',
          border: 'var(--rose-border)',
          label: 'High Severity',
        };
      case 'medium':
        return {
          bg: 'var(--amber-bg)',
          color: 'var(--amber)',
          border: 'var(--amber-border)',
          label: 'Medium Attention',
        };
      case 'low':
      default:
        return {
          bg: 'var(--cyan-bg)',
          color: 'var(--cyan)',
          border: 'var(--cyan-border)',
          label: 'Info / Notice',
        };
    }
  };

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div className="card banner-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="milestone-tag active">Milestone 4</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>
              Real-Time Alert Dispatching
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Notifications & Anomaly Alerts
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Telemetry alerts for high-demand surges, low-occupancy triggers, safeguard limit clamps, and rule events.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-secondary" style={{ fontSize: '12px' }}>
              ✓ Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={handleClearAll} className="btn-secondary" style={{ fontSize: '12px', color: 'var(--rose)' }}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Alert Metrics Row */}
      <div className="grid-4">
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Active Unread Alerts</span>
            <span style={{ padding: '6px', background: 'var(--gold-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconNotifications size={16} color="var(--gold-primary)" />
            </span>
          </div>
          <div className="card-value" style={{ color: unreadCount > 0 ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
            {unreadCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Requires operator attention
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Surge Demand Alerts</span>
            <span style={{ padding: '6px', background: 'var(--rose-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconTrendingUp size={16} color="var(--rose)" />
            </span>
          </div>
          <div className="card-value" style={{ color: 'var(--rose)' }}>
            {notifications.filter((n) => n.type === 'high_demand').length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Pacing above 80% occupancy
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Safeguard Limit Alerts</span>
            <span style={{ padding: '6px', background: 'var(--emerald-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconShield size={16} color="var(--emerald)" />
            </span>
          </div>
          <div className="card-value" style={{ color: 'var(--emerald)' }}>
            {notifications.filter((n) => n.type === 'limit_reached' || n.type === 'rule_applied').length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--emerald)', marginTop: '6px', fontWeight: '600' }}>
            ● Protected Floor & Ceiling
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Low Occupancy Warnings</span>
            <span style={{ padding: '6px', background: 'var(--amber-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconDollar size={16} color="var(--amber)" />
            </span>
          </div>
          <div className="card-value" style={{ color: 'var(--amber)' }}>
            {notifications.filter((n) => n.type === 'low_occupancy').length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Promo discounts active
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: `All Alerts (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'high_demand', label: 'Surge Demand' },
          { id: 'low_occupancy', label: 'Low Occupancy' },
          { id: 'pending_approval', label: 'Rate Approvals' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: 'var(--radius-sm)',
              border: activeTab === tab.id ? '1px solid var(--gold-border)' : '1px solid var(--border-subtle)',
              background: activeTab === tab.id ? 'var(--gold-bg)' : '#ffffff',
              color: activeTab === tab.id ? 'var(--gold-primary)' : 'var(--text-light)',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading notification feed...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No notifications in this feed.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((notif) => {
              const badge = getSeverityBadge(notif.severity);

              return (
                <div
                  key={notif._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: notif.read ? '#ffffff' : 'rgba(37, 99, 235, 0.03)',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    {/* Read dot */}
                    <span
                      style={{
                        marginTop: '6px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: notif.read ? 'transparent' : 'var(--gold-primary)',
                        flexShrink: 0,
                      }}
                    />

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          className="status-tag"
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            borderColor: badge.border,
                            fontSize: '9px',
                          }}
                        >
                          {badge.label}
                        </span>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {notif.title}
                        </h4>
                      </div>

                      <p style={{ fontSize: '12px', color: 'var(--text-light)', lineHeight: '1.4' }}>
                        {notif.message}
                      </p>

                      <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '6px', display: 'inline-block' }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '12px' }}>
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notif._id)}
                      className="btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--rose)' }}
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alert Dispatcher Preferences Card */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
          ⚙️ Automated Alert Preferences & Channels
        </h3>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Configure dispatching rules for revenue telemetry anomalies.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={alertPreferences.surgeAlerts}
              onChange={(e) => setAlertPreferences({ ...alertPreferences, surgeAlerts: e.target.checked })}
            />
            <span>High-Demand Surge Triggers (&gt;80% occupancy)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={alertPreferences.guardrailBreaches}
              onChange={(e) => setAlertPreferences({ ...alertPreferences, guardrailBreaches: e.target.checked })}
            />
            <span>Safeguard Floor/Ceiling Limit Clamping</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={alertPreferences.lowOccupancyPromos}
              onChange={(e) => setAlertPreferences({ ...alertPreferences, lowOccupancyPromos: e.target.checked })}
            />
            <span>Low Occupancy Discount Triggers (&lt;30%)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={alertPreferences.dailyDigest}
              onChange={(e) => setAlertPreferences({ ...alertPreferences, dailyDigest: e.target.checked })}
            />
            <span>Daily RevPAR Email Digest to Management</span>
          </label>
        </div>
      </div>
    </div>
  );
}
