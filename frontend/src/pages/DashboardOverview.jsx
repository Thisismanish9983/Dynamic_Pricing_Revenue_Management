import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function DashboardOverview() {
  const { user, organization, isAdmin, isRevenueManager, isStaff } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await apiClient.get('/dashboard/overview');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
        <div>Loading operational metrics...</div>
      </div>
    );
  }

  const { kpis, highDemandItems, lowDemandItems, recentActivity } = data || {};

  return (
    <div className="page-wrapper">
      {/* Top Welcome Banner */}
      <div className="card banner-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>
              Welcome back, {user?.name}
            </h1>
            <span className="status-tag">{organization?.name}</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time dynamic pricing telemetry, occupancy monitoring, and automated revenue insights.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="btn-secondary"
        >
          {refreshing ? 'Refreshing...' : '🔄 Refresh Telemetry'}
        </button>
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="grid-4">
        {/* Card 1: Projected Revenue */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Projected Monthly Revenue</span>
            <span style={{ fontSize: '18px' }}>💰</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div className="card-value">${kpis?.currentRevenue?.toLocaleString() || 0}</div>
            <div className="card-trend trend-up">↑ +{kpis?.revenueGrowthPercentage}%</div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
            Daily run-rate: ${kpis?.dailyRevenue?.toLocaleString()} / day
          </div>
        </div>

        {/* Card 2: Average Rate */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Average Unit Rate (ADR)</span>
            <span style={{ fontSize: '18px' }}>📈</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div className="card-value">${kpis?.averagePrice || 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Across {kpis?.totalProducts} units</div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
            Dynamically adjusted per demand rules
          </div>
        </div>

        {/* Card 3: Portfolio Occupancy */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Portfolio Occupancy</span>
            <span style={{ fontSize: '18px' }}>🏨</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div className="card-value">{kpis?.occupancyRate || 0}%</div>
            <div style={{ fontSize: '12px', color: 'var(--primary-light)' }}>
              {kpis?.totalOccupied} / {kpis?.totalCapacity} Units
            </div>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${kpis?.occupancyRate || 0}%` }}
            />
          </div>
        </div>

        {/* Card 4: Price Adjustments */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Active Price Adjustments</span>
            <span style={{ fontSize: '18px' }}>⚡</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div className="card-value">{kpis?.activePriceChanges || 0}</div>
            <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '600' }}>Engine Active</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
            {kpis?.highDemandCount} surge • {kpis?.lowDemandCount} promo active
          </div>
        </div>
      </div>

      {/* High Demand vs Low Demand Segmentation */}
      <div className="grid-2">
        {/* High Demand */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🔥</span>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                  High-Demand Products (≥75% Occupancy)
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Surge rate adjustment active</div>
              </div>
            </div>
            <span className="status-tag" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}>
              {highDemandItems?.length || 0} Units
            </span>
          </div>

          <div className="item-list">
            {highDemandItems && highDemandItems.length > 0 ? (
              highDemandItems.map((item) => (
                <div key={item.id} className="item-row">
                  <div>
                    <div className="item-name">{item.name}</div>
                    <div className="item-sub">{item.category}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>
                        ${item.currentPrice}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Current Rate</div>
                    </div>
                    <span style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      {item.occupancy}% Occ.
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                No products currently exceeding 75% occupancy.
              </div>
            )}
          </div>
        </div>

        {/* Low Demand */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>❄️</span>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                  Low-Demand Products (&lt;35% Occupancy)
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Promotional incentive active</div>
              </div>
            </div>
            <span className="status-tag">
              {lowDemandItems?.length || 0} Units
            </span>
          </div>

          <div className="item-list">
            {lowDemandItems && lowDemandItems.length > 0 ? (
              lowDemandItems.map((item) => (
                <div key={item.id} className="item-row">
                  <div>
                    <div className="item-name">{item.name}</div>
                    <div className="item-sub">{item.category}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-light)' }}>
                        ${item.currentPrice}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Discounted</div>
                    </div>
                    <span style={{
                      backgroundColor: 'var(--primary-bg)',
                      color: 'var(--primary-light)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      {item.occupancy}% Occ.
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                No products currently below 35% occupancy.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Trail */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🕒</span>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
              Audit Logging & Price Actions
            </h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Multi-Tenant Scoped</span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User / Agent</th>
                <th>Action</th>
                <th>Target Entity</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td style={{ fontWeight: '600', color: '#fff' }}>
                      {log.userId?.name || 'System Engine'}
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>
                      {log.action}
                    </td>
                    <td>{log.entityType}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="milestone-tag active">LOGGED</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    No audit records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
