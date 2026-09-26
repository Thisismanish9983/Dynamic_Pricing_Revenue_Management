import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  IconCalendar,
  IconDollar,
  IconTrendingUp,
  IconShield,
} from '../components/Icons';

export default function PriceCalendar() {
  const { isAdmin, isRevenueManager } = useAuth();
  const canOverride = isAdmin || isRevenueManager;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Override Modal state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedDayRate, setSelectedDayRate] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    overridePrice: '',
    reason: '',
  });
  const [overrideError, setOverrideError] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatMonthParam = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const monthStr = formatMonthParam(currentDate);
      const params = new URLSearchParams({ month: monthStr });
      if (selectedCategory !== 'all') params.append('category', selectedCategory);

      const res = await apiClient.get(`/calendar?${params.toString()}`);
      if (res.success) {
        setCalendarData(res);
      }
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [currentDate, selectedCategory]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenOverride = (day, rate) => {
    if (!canOverride) return;
    setSelectedDayRate({ ...rate, date: day.date, dayOfWeek: day.dayOfWeek });
    setOverrideForm({
      overridePrice: rate.overridePrice || rate.finalPrice,
      reason: rate.overrideReason || 'Manual revenue adjustment',
    });
    setOverrideError('');
    setOverrideSuccess('');
    setOverrideModalOpen(true);
  };

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    setOverrideError('');
    setOverrideSuccess('');

    const priceNum = Number(overrideForm.overridePrice);
    if (priceNum < selectedDayRate.minPrice || priceNum > selectedDayRate.maxPrice) {
      setOverrideError(
        `Safeguard violation: Override must remain between Min ($${selectedDayRate.minPrice}) and Max ($${selectedDayRate.maxPrice}).`
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post('/calendar/override', {
        productId: selectedDayRate.productId,
        date: selectedDayRate.date,
        overridePrice: priceNum,
        reason: overrideForm.reason,
      });

      if (res.success) {
        setOverrideSuccess(res.message);
        setTimeout(() => {
          setOverrideModalOpen(false);
          fetchCalendar();
        }, 800);
      }
    } catch (err) {
      setOverrideError(err.message || 'Failed to save override');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearOverride = async () => {
    if (!selectedDayRate.overrideId) return;
    if (!window.confirm('Clear manual override and restore algorithmic dynamic price?')) return;

    try {
      setSubmitting(true);
      const res = await apiClient.delete(`/calendar/override/${selectedDayRate.overrideId}`);
      if (res.success) {
        setOverrideSuccess(res.message);
        setTimeout(() => {
          setOverrideModalOpen(false);
          fetchCalendar();
        }, 800);
      }
    } catch (err) {
      setOverrideError(err.message || 'Failed to clear override');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div className="card banner-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="milestone-tag active">Milestone 3</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>
              Interactive Rate Calendar & Overrides
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Interactive Price Calendar
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Visual rate matrix with occupancy demand heatmaps. Compare Base vs Dynamic Rates and apply overrides.
          </p>
        </div>

        {/* Navigation & Month Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handlePrevMonth} className="btn-secondary" style={{ padding: '6px 12px' }}>
            ◀ Prev
          </button>
          <button onClick={handleToday} className="btn-secondary" style={{ padding: '6px 14px', fontWeight: '700' }}>
            Today
          </button>
          <button onClick={handleNextMonth} className="btn-secondary" style={{ padding: '6px 12px' }}>
            Next ▶
          </button>

          <span
            style={{
              fontSize: '14px',
              fontWeight: '700',
              padding: '6px 14px',
              background: 'var(--gold-bg)',
              color: 'var(--gold-primary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--gold-border)',
            }}
          >
            {calendarData?.monthName || 'Loading...'}
          </span>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>Filter Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <option value="all">All Categories</option>
            <option value="Deluxe Rooms">Deluxe Rooms</option>
            <option value="Suites">Suites</option>
            <option value="Standard Rooms">Standard Rooms</option>
          </select>
        </div>

        {/* Heatmap Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '11px', fontWeight: '600' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#e0f2fe', border: '1px solid #7dd3fc' }}></span>
            Low (&lt;35%)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ecfdf5', border: '1px solid #6ee7b7' }}></span>
            Normal (35-65%)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#fffbeb', border: '1px solid #fcd34d' }}></span>
            High (65-80%)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#fef2f2', border: '1px solid #fca5a5' }}></span>
            Surge / Weekend (&gt;80%)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--gold-primary)', fontWeight: '800' }}>✏️</span>
            Manager Override
          </span>
        </div>
      </div>

      {/* Calendar Matrix Grid */}
      <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading rate matrix and demand heatmaps...
          </div>
        ) : !calendarData?.days ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No calendar data available.
          </div>
        ) : (
          <div className="table-responsive" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Date</th>
                  <th style={{ width: '70px' }}>Day</th>
                  <th>Category & Unit Rates Matrix</th>
                </tr>
              </thead>
              <tbody>
                {calendarData.days.map((day) => {
                  const isToday = day.date === new Date().toISOString().split('T')[0];

                  return (
                    <tr
                      key={day.date}
                      style={{
                        backgroundColor: isToday
                          ? 'rgba(37, 99, 235, 0.04)'
                          : day.isWeekend
                          ? '#fcfdfd'
                          : '#ffffff',
                      }}
                    >
                      {/* Date */}
                      <td style={{ fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {day.date}
                        {isToday && (
                          <span
                            className="status-tag"
                            style={{ display: 'block', width: 'fit-content', marginTop: '2px', fontSize: '9px' }}
                          >
                            Today
                          </span>
                        )}
                      </td>

                      {/* Day of week */}
                      <td>
                        <span
                          style={{
                            fontWeight: '700',
                            fontSize: '11px',
                            color: day.isWeekend ? 'var(--amber)' : 'var(--text-muted)',
                          }}
                        >
                          {day.dayOfWeek}
                        </span>
                      </td>

                      {/* Rates cards */}
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {day.rates.map((rate) => {
                            const hasOverride = !!rate.overridePrice;
                            const isSurge = rate.demandLevel === 'surge';
                            const isHigh = rate.demandLevel === 'high';
                            const isLow = rate.demandLevel === 'low';

                            let bg = '#ffffff';
                            let border = 'var(--border-subtle)';
                            if (hasOverride) {
                              bg = '#eff6ff';
                              border = 'var(--gold-border)';
                            } else if (isSurge) {
                              bg = '#fef2f2';
                              border = '#fca5a5';
                            } else if (isHigh) {
                              bg = '#fffbeb';
                              border = '#fcd34d';
                            } else if (isLow) {
                              bg = '#f0f9ff';
                              border = '#bae6fd';
                            } else {
                              bg = '#ecfdf5';
                              border = '#a7f3d0';
                            }

                            return (
                              <div
                                key={rate.productId}
                                onClick={() => handleOpenOverride(day, rate)}
                                title={
                                  canOverride
                                    ? `Click to override rate for ${rate.productName} on ${day.date}`
                                    : 'Rate details'
                                }
                                style={{
                                  background: bg,
                                  border: `1px solid ${border}`,
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '8px 12px',
                                  cursor: canOverride ? 'pointer' : 'default',
                                  minWidth: '170px',
                                  flex: '1 1 180px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    {rate.productName.length > 20 ? rate.productName.slice(0, 18) + '...' : rate.productName}
                                  </span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                                    {rate.occupancyRate}% Occ
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                                  <div>
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: hasOverride ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                                      ${rate.finalPrice}
                                    </span>
                                    {rate.finalPrice !== rate.basePrice && (
                                      <span style={{ fontSize: '10px', color: 'var(--text-dim)', textDecoration: 'line-through', marginLeft: '6px' }}>
                                        ${rate.basePrice}
                                      </span>
                                    )}
                                  </div>

                                  {hasOverride ? (
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--gold-primary)', background: '#fff', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--gold-border)' }}>
                                      ✏️ Override
                                    </span>
                                  ) : isSurge ? (
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--rose)' }}>
                                      🔥 Surge
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--emerald)' }}>
                                      ✓ Dynamic
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Rate Override Modal */}
      {overrideModalOpen && selectedDayRate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <button onClick={() => setOverrideModalOpen(false)} className="modal-close">×</button>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Manual Rate Override
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Target: <strong>{selectedDayRate.productName}</strong> on <strong>{selectedDayRate.date}</strong> ({selectedDayRate.dayOfWeek})
            </p>

            {overrideError && <div className="alert alert-danger" style={{ marginBottom: '12px' }}>⚠️ {overrideError}</div>}
            {overrideSuccess && <div className="alert alert-success" style={{ marginBottom: '12px' }}>✓ {overrideSuccess}</div>}

            {/* Current Rates Comparison Box */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '14px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Base Target Rate:</span>
                <strong>${selectedDayRate.basePrice}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Algorithmic Recommended Rate:</span>
                <strong style={{ color: 'var(--gold-primary)' }}>${selectedDayRate.recommendedPrice}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-subtle)', paddingTop: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hard Safe Limits (Floor — Ceiling):</span>
                <strong style={{ color: 'var(--emerald)' }}>
                  ${selectedDayRate.minPrice} — ${selectedDayRate.maxPrice}
                </strong>
              </div>
            </div>

            <form onSubmit={handleSaveOverride}>
              <div className="form-group">
                <label>Manual Override Rate ($) *</label>
                <input
                  type="number"
                  required
                  min={selectedDayRate.minPrice}
                  max={selectedDayRate.maxPrice}
                  value={overrideForm.overridePrice}
                  onChange={(e) => setOverrideForm({ ...overrideForm, overridePrice: e.target.value })}
                  placeholder={`Between $${selectedDayRate.minPrice} and $${selectedDayRate.maxPrice}`}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                  Strictly enforced between ${selectedDayRate.minPrice} and ${selectedDayRate.maxPrice}.
                </span>
              </div>

              <div className="form-group">
                <label>Override Rationale / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Corporate group booking agreement, local festival surcharge..."
                  value={overrideForm.reason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' }}>
                {selectedDayRate.overrideId ? (
                  <button
                    type="button"
                    onClick={handleClearOverride}
                    disabled={submitting}
                    className="btn-secondary"
                    style={{ color: 'var(--rose)', borderColor: 'var(--rose-border)' }}
                  >
                    Clear Override
                  </button>
                ) : <div></div>}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setOverrideModalOpen(false)}
                    className="btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Apply Override'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
