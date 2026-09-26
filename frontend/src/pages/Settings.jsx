import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function Settings() {
  const { isAdmin } = useAuth();
  const [orgData, setOrgData] = useState({
    name: '',
    industry: 'hotel',
    currency: 'USD',
    timezone: 'America/New_York',
    settings: {
      autoApproveRules: false,
      enableAnomalyAlerts: true,
      defaultMinPriceMargin: 0.7,
      defaultMaxPriceMargin: 1.8,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await apiClient.get('/organizations/current');
        if (res.success) {
          const org = res.organization;
          setOrgData({
            name: org.name || '',
            industry: org.industry || 'hotel',
            currency: org.currency || 'USD',
            timezone: org.timezone || 'America/New_York',
            settings: {
              autoApproveRules: org.settings?.autoApproveRules ?? false,
              enableAnomalyAlerts: org.settings?.enableAnomalyAlerts ?? true,
              defaultMinPriceMargin: org.settings?.defaultMinPriceMargin ?? 0.7,
              defaultMaxPriceMargin: org.settings?.defaultMaxPriceMargin ?? 1.8,
            },
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      const res = await apiClient.put('/organizations/current/settings', orgData);
      if (res.success) {
        setMsg('Organization settings saved successfully!');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      setErr(e.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading settings...</div>;
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '860px' }}>
      <div className="card banner-card">
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Organization & Tenant Settings
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Manage pricing safeguard guardrails, automation rules, and tenant preferences.
          </p>
        </div>
      </div>

      {msg && <div className="alert alert-success">✓ {msg}</div>}
      {err && <div className="alert alert-danger">⚠️ {err}</div>}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* General Info */}
        <div className="card">
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
            General Tenant Information
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Organization Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Industry Domain</label>
              <select
                disabled={!isAdmin}
                value={orgData.industry}
                onChange={(e) => setOrgData({ ...orgData, industry: e.target.value })}
              >
                <option value="hotel">Hotels & Hospitality</option>
                <option value="vacation_rental">Vacation Rentals</option>
                <option value="event_venue">Event Venues</option>
                <option value="parking">Parking Operations</option>
                <option value="rental_business">Equipment / Vehicle Rentals</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Reporting Currency</label>
              <select
                disabled={!isAdmin}
                value={orgData.currency}
                onChange={(e) => setOrgData({ ...orgData, currency: e.target.value })}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Timezone</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={orgData.timezone}
                onChange={(e) => setOrgData({ ...orgData, timezone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Pricing Safeguards */}
        <div className="card">
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Dynamic Pricing Engine Safeguards
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Default Floor Margin (Minimum Price Limit)</label>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                Multiplied by Base Price to guarantee rates never drop below cost.
              </div>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                disabled={!isAdmin}
                value={orgData.settings.defaultMinPriceMargin}
                onChange={(e) =>
                  setOrgData({
                    ...orgData,
                    settings: { ...orgData.settings, defaultMinPriceMargin: parseFloat(e.target.value) },
                  })
                }
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {(orgData.settings.defaultMinPriceMargin * 100).toFixed(0)}% of Base Rate
              </span>
            </div>

            <div className="form-group">
              <label>Default Ceiling Margin (Maximum Price Cap)</label>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                Hard ceiling cap to avoid excessive price gouging during peak demand.
              </div>
              <input
                type="number"
                step="0.05"
                min="1.0"
                max="5.0"
                disabled={!isAdmin}
                value={orgData.settings.defaultMaxPriceMargin}
                onChange={(e) =>
                  setOrgData({
                    ...orgData,
                    settings: { ...orgData.settings, defaultMaxPriceMargin: parseFloat(e.target.value) },
                  })
                }
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {(orgData.settings.defaultMaxPriceMargin * 100).toFixed(0)}% of Base Rate
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={orgData.settings.autoApproveRules}
                onChange={(e) =>
                  setOrgData({
                    ...orgData,
                    settings: { ...orgData.settings, autoApproveRules: e.target.checked },
                  })
                }
                style={{ width: '16px', height: '16px' }}
              />
              <div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Auto-Publish Calculated Dynamic Rates
                </span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  When enabled, rules automatically publish without requiring manual Revenue Manager review.
                </p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={orgData.settings.enableAnomalyAlerts}
                onChange={(e) =>
                  setOrgData({
                    ...orgData,
                    settings: { ...orgData.settings, enableAnomalyAlerts: e.target.checked },
                  })
                }
                style={{ width: '16px', height: '16px' }}
              />
              <div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Enable Anomaly & Demand Spike Alerts
                </span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Notifies operations when occupancy rapidly spikes without rate adjustments.
                </p>
              </div>
            </label>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : '💾 Save Organization Settings'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
