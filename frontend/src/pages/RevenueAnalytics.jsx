import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import {
  IconAnalytics,
  IconDollar,
  IconPercent,
  IconTrendingUp,
  IconShield,
} from '../components/Icons';

export default function RevenueAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/analytics?timeframe=${timeframe}`);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const handleExportCSV = () => {
    if (!data?.timeline) return;

    const headers = ['Date', 'Day', 'IsWeekend', 'DynamicRevenue', 'BaseRevenue', 'OccupancyPercent'];
    const rows = data.timeline.map((row) => [
      row.date,
      row.day,
      row.isWeekend ? 'Yes' : 'No',
      row.revenue,
      row.baseRevenue,
      row.occupancy,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `revenue_analytics_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div className="page-wrapper">
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Computing revenue telemetry and AI insights...
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const timeline = data?.timeline || [];
  const maxRevenue = Math.max(...timeline.map((t) => t.revenue), 1000);

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div className="card banner-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="milestone-tag active">Milestone 4</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>
              Algorithmic Revenue Intelligence
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Revenue Analytics & AI Insights
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Comprehensive revenue forecasting, demand anomaly detection, and explainable AI pricing telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} className="btn-secondary" style={{ fontSize: '12px' }}>
            📥 Export CSV
          </button>
          <button onClick={handlePrint} className="btn-primary" style={{ fontSize: '12px' }}>
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        {/* KPI 1: Projected Revenue */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Monthly Projected Revenue</span>
            <span style={{ padding: '6px', background: 'var(--gold-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconDollar size={16} color="var(--gold-primary)" />
            </span>
          </div>
          <div className="card-value">
            ${Number(kpis.totalProjectedMonthlyRevenue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--emerald)', marginTop: '6px', fontWeight: '700' }}>
            ↑ +{kpis.projectedRevenueLiftPercentage}% algorithmic lift vs base
          </div>
        </div>

        {/* KPI 2: RevPAR */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">RevPAR (Rev / Available Room)</span>
            <span style={{ padding: '6px', background: 'var(--emerald-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconTrendingUp size={16} color="var(--emerald)" />
            </span>
          </div>
          <div className="card-value">
            ${kpis.revenuePerAvailableRoom}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Portfolio yield efficiency
          </div>
        </div>

        {/* KPI 3: ADR */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">ADR (Average Daily Rate)</span>
            <span style={{ padding: '6px', background: 'var(--sapphire-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconDollar size={16} color="var(--sapphire)" />
            </span>
          </div>
          <div className="card-value">
            ${kpis.averageDailyRate}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Across all booked inventory
          </div>
        </div>

        {/* KPI 4: Occupancy Rate */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Average Portfolio Occupancy</span>
            <span style={{ padding: '6px', background: 'var(--amber-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconPercent size={16} color="var(--amber)" />
            </span>
          </div>
          <div className="card-value">
            {kpis.averageOccupancyRate}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {kpis.totalOccupied} / {kpis.totalCapacity} total units active
          </div>
        </div>
      </div>

      {/* Interactive Charts Section (Pure SVG & CSS) */}
      <div className="grid-2">
        {/* Chart 1: Revenue Timeline Trend */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                📈 Revenue Trajectory (Dynamic vs Base)
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Blue = Dynamic Rate Yield • Grey = Static Base Rate
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--gold-primary)', fontWeight: '700' }}>● Dynamic</span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>● Baseline</span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            {timeline.map((item, idx) => {
              const dynHeight = Math.max(15, Math.round((item.revenue / maxRevenue) * 170));
              const baseHeight = Math.max(10, Math.round((item.baseRevenue / maxRevenue) * 170));

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', justifyContent: 'center' }}>
                    {/* Base Bar */}
                    <div
                      style={{
                        width: '40%',
                        height: `${baseHeight}px`,
                        background: '#e2e8f0',
                        borderRadius: '2px 2px 0 0',
                      }}
                      title={`Base: $${item.baseRevenue}`}
                    />
                    {/* Dynamic Bar */}
                    <div
                      style={{
                        width: '50%',
                        height: `${dynHeight}px`,
                        background: item.isWeekend
                          ? 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)'
                          : 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)',
                        borderRadius: '2px 2px 0 0',
                      }}
                      title={`Dynamic Rate: $${item.revenue} (${item.day}, ${item.date})`}
                    />
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '6px' }}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
            <span>14 Days Ago</span>
            <span>Today (Live Revenue Optimization)</span>
          </div>
        </div>

        {/* Chart 2: Occupancy Heat Bar */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                📊 Occupancy Rate Fluctuation
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Target threshold: 80% (triggers automated demand surge rules)
              </span>
            </div>
            <span className="status-tag">Real-Time</span>
          </div>

          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>
            {/* 80% Threshold Guide Line */}
            <div
              style={{
                position: 'absolute',
                top: '20%',
                left: 0,
                right: 0,
                borderTop: '1px dashed #ef4444',
                pointerEvents: 'none',
              }}
            >
              <span style={{ position: 'absolute', right: 0, top: '-16px', fontSize: '9px', color: '#ef4444', fontWeight: '700' }}>
                80% Surge Trigger
              </span>
            </div>

            {timeline.map((item, idx) => {
              const barHeight = Math.max(12, Math.round((item.occupancy / 100) * 170));
              const isOver80 = item.occupancy >= 80;

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      width: '80%',
                      height: `${barHeight}px`,
                      background: isOver80
                        ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(180deg, #93c5fd 0%, #3b82f6 100%)',
                      borderRadius: '3px 3px 0 0',
                    }}
                    title={`Occupancy: ${item.occupancy}% on ${item.date}`}
                  />
                  <span style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '6px' }}>
                    {item.occupancy}%
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
            <span>Green = High Yield (&gt;80%)</span>
            <span>Blue = Standard Operations</span>
          </div>
        </div>
      </div>

      {/* AI Explainability & Demand Anomalies */}
      <div className="grid-2">
        {/* AI Explainability Insights */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              🤖 AI Pricing Insights & Explainability
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--emerald)', background: 'var(--emerald-bg)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
              ✓ Transparent AI
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data?.aiInsights?.map((ins) => (
              <div
                key={ins.id}
                style={{
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {ins.title}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--emerald)' }}>
                    {ins.impact}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', lineHeight: '1.4' }}>
                  {ins.description}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '6px' }}>
                  Algorithmic Confidence: <strong>{ins.confidence}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demand Anomaly Detection */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              ⚡ Demand Anomaly & Guardrail Triggers
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--amber)', background: 'var(--amber-bg)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
              Real-Time Telemetry
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data?.anomalies?.map((anom) => (
              <div
                key={anom.id}
                style={{
                  padding: '12px 14px',
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft:
                    anom.severity === 'high'
                      ? '4px solid var(--rose)'
                      : anom.severity === 'medium'
                      ? '4px solid var(--amber)'
                      : '4px solid var(--cyan)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {anom.title}
                  </span>
                  <span
                    className="status-tag"
                    style={{
                      background: anom.severity === 'high' ? 'var(--rose-bg)' : 'var(--amber-bg)',
                      color: anom.severity === 'high' ? 'var(--rose)' : 'var(--amber)',
                      borderColor: anom.severity === 'high' ? 'var(--rose-border)' : 'var(--amber-border)',
                      fontSize: '9px',
                    }}
                  >
                    {anom.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', lineHeight: '1.4' }}>
                  {anom.description}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '6px' }}>
                  Timeframe: <strong>{anom.date}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Performance Breakdown */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Category Performance & Revenue Contribution
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Comparison of Baseline vs Dynamically Generated Revenue per inventory group.
          </span>
        </div>

        <div className="table-responsive" style={{ margin: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Inventory Types</th>
                <th>Capacity In-Use</th>
                <th>Occupancy %</th>
                <th>Static Base Revenue</th>
                <th>Dynamic Live Revenue</th>
                <th>Net Yield Lift</th>
              </tr>
            </thead>
            <tbody>
              {data?.categories?.map((cat) => {
                const diff = cat.currentRevenue - cat.baseRevenue;
                const liftPct =
                  cat.baseRevenue > 0
                    ? Math.round((diff / cat.baseRevenue) * 1000) / 10
                    : 0;

                return (
                  <tr key={cat.category}>
                    <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      {cat.category}
                    </td>
                    <td>{cat.productsCount} unit types</td>
                    <td>{cat.occupied} / {cat.capacity} units</td>
                    <td>
                      <span style={{ fontWeight: '600', color: cat.occupancyRate >= 80 ? 'var(--emerald)' : 'var(--text-light)' }}>
                        {cat.occupancyRate}%
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>${cat.baseRevenue}/day</td>
                    <td>
                      <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                        ${cat.currentRevenue}/day
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', color: 'var(--emerald)', background: 'var(--emerald-bg)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--emerald-border)', fontSize: '11px' }}>
                        +${diff} (+{liftPct}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
