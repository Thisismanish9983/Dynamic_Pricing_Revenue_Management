import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  IconRecommendations,
  IconDollar,
  IconShield,
  IconTrendingUp,
} from '../components/Icons';

export default function Recommendations() {
  const { isAdmin, isRevenueManager } = useAuth();
  const canApprove = isAdmin || isRevenueManager;

  const [recommendations, setRecommendations] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    overriddenCount: 0,
    projectedPotentialLift: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [decisionHistory, setDecisionHistory] = useState([]);
  const [actionMsg, setActionMsg] = useState('');

  // Modify Modal state
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);
  const [modifyPrice, setModifyPrice] = useState('');
  const [modifyNote, setModifyNote] = useState('');
  const [modifyError, setModifyError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/recommendations?status=${statusFilter}`);
      if (res.success) {
        setRecommendations(res.recommendations || []);
        if (res.metrics) setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get('/recommendations/history');
      if (res.success) {
        setDecisionHistory(res.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch decision history:', err);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    if (!canApprove) return;
    try {
      const res = await apiClient.post(`/recommendations/${id}/approve`, {});
      if (res.success) {
        setActionMsg(res.message);
        fetchRecommendations();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to approve recommendation');
    }
  };

  const handleReject = async (id) => {
    if (!canApprove) return;
    const reason = window.prompt('Enter reason for rejecting this recommendation (optional):', 'Market condition mismatch');
    if (reason === null) return;

    try {
      const res = await apiClient.post(`/recommendations/${id}/reject`, { reviewNote: reason });
      if (res.success) {
        setActionMsg(res.message);
        fetchRecommendations();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to reject recommendation');
    }
  };

  const handleOpenModifyModal = (rec) => {
    if (!canApprove) return;
    setSelectedRec(rec);
    setModifyPrice(rec.recommendedPrice);
    setModifyNote('');
    setModifyError('');
    setModifyModalOpen(true);
  };

  const handleSaveModify = async (e) => {
    e.preventDefault();
    setModifyError('');

    const priceNum = Number(modifyPrice);
    const minP = selectedRec.productId?.minPrice || 50;
    const maxP = selectedRec.productId?.maxPrice || 1000;

    if (priceNum < minP || priceNum > maxP) {
      setModifyError(`Price must adhere to product guardrails ($${minP} — $${maxP}).`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post(`/recommendations/${selectedRec._id}/override`, {
        overridePrice: priceNum,
        reviewNote: modifyNote || 'Modified by Revenue Manager',
      });
      if (res.success) {
        setModifyModalOpen(false);
        setActionMsg(res.message);
        fetchRecommendations();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch (err) {
      setModifyError(err.message || 'Failed to modify rate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchApprove = async () => {
    if (!canApprove) return;
    if (!window.confirm(`Approve all ${metrics.pendingCount} pending rate recommendations at once?`)) return;

    try {
      const res = await apiClient.post('/recommendations/batch-approve', {});
      if (res.success) {
        setActionMsg(res.message);
        fetchRecommendations();
        setTimeout(() => setActionMsg(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to batch approve');
    }
  };

  const toggleHistory = () => {
    if (!historyOpen) {
      fetchHistory();
    }
    setHistoryOpen(!historyOpen);
  };

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div className="card banner-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="milestone-tag active">Milestone 3</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>
              Human-in-the-Loop Governance
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Price Approval & Override Workflow
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Review queue for Revenue Managers to inspect algorithmically computed price suggestions before publishing.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={toggleHistory} className="btn-secondary" style={{ fontSize: '12px' }}>
            {historyOpen ? 'Hide Decision History' : '📜 View Decision History'}
          </button>

          {canApprove && metrics.pendingCount > 0 && (
            <button
              onClick={handleBatchApprove}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #059669, #047857)', borderColor: '#047857' }}
            >
              🚀 Approve All Pending ({metrics.pendingCount})
            </button>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="alert alert-success">
          ✓ {actionMsg}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid-4">
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Pending Review</span>
            <span style={{ padding: '6px', background: 'var(--gold-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconRecommendations size={16} color="var(--gold-primary)" />
            </span>
          </div>
          <div className="card-value" style={{ color: metrics.pendingCount > 0 ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
            {metrics.pendingCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Awaiting manager confirmation
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Approved Rates</span>
            <span style={{ padding: '6px', background: 'var(--emerald-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconShield size={16} color="var(--emerald)" />
            </span>
          </div>
          <div className="card-value" style={{ color: 'var(--emerald)' }}>
            {metrics.approvedCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Published to live booking engine
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Rejected / Baseline</span>
            <span style={{ padding: '6px', background: 'var(--rose-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconDollar size={16} color="var(--rose)" />
            </span>
          </div>
          <div className="card-value">
            {metrics.rejectedCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Standard rates retained
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Potential Lift</span>
            <span style={{ padding: '6px', background: 'var(--sapphire-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconTrendingUp size={16} color="var(--sapphire)" />
            </span>
          </div>
          <div className="card-value" style={{ color: 'var(--sapphire)' }}>
            +${metrics.projectedPotentialLift}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Incremental yield from pending
          </div>
        </div>
      </div>

      {/* Decision History Drawer (if toggled) */}
      {historyOpen && (
        <div className="card" style={{ border: '2px solid var(--sapphire-border)', background: '#fafbff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              📜 Revenue Manager Decision Trail & Audit Log ({decisionHistory.length})
            </h3>
            <button onClick={() => setHistoryOpen(false)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
              Close Trail
            </button>
          </div>

          {decisionHistory.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              No historical pricing decisions recorded yet.
            </div>
          ) : (
            <div className="table-responsive" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Decision Details</th>
                  </tr>
                </thead>
                <tbody>
                  {decisionHistory.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {item.userId?.name || 'System'} <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>({item.userId?.role})</span>
                      </td>
                      <td>
                        <span className="status-tag" style={{ background: '#f1f5f9', color: 'var(--text-light)', borderColor: 'var(--border-subtle)' }}>
                          {item.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {item.details ? JSON.stringify(item.details).replace(/[{}"]/g, ' ') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'pending', label: `Pending Review (${metrics.pendingCount})` },
          { id: 'approved', label: `Approved (${metrics.approvedCount})` },
          { id: 'overridden', label: `Manager Overridden (${metrics.overriddenCount})` },
          { id: 'rejected', label: `Rejected (${metrics.rejectedCount})` },
          { id: 'all', label: `All (${metrics.total})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: 'var(--radius-sm)',
              border: statusFilter === tab.id ? '1px solid var(--gold-border)' : '1px solid var(--border-subtle)',
              background: statusFilter === tab.id ? 'var(--gold-bg)' : '#ffffff',
              color: statusFilter === tab.id ? 'var(--gold-primary)' : 'var(--text-light)',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendations Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Recommendation Queue ({recommendations.length})
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Algorithmic recommendations require Revenue Manager authorization before publishing.
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading rate recommendations...
          </div>
        ) : recommendations.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No recommendations in this review state.
          </div>
        ) : (
          <div className="table-responsive" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Target Date</th>
                  <th>Product / Room</th>
                  <th>Current Rate</th>
                  <th>Recommended Rate</th>
                  <th>Delta / Lift</th>
                  <th>Algorithm Trigger Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((rec) => {
                  const diff = rec.recommendedPrice - (rec.currentPrice || rec.basePrice);
                  const isPositive = diff > 0;

                  return (
                    <tr key={rec._id}>
                      {/* Date */}
                      <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                        {rec.targetDate}
                      </td>

                      {/* Product */}
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {rec.productId?.name || 'Inventory Unit'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          {rec.productId?.category} • Occ: {rec.occupancyRate}%
                        </div>
                      </td>

                      {/* Current Rate */}
                      <td style={{ color: 'var(--text-muted)' }}>
                        ${rec.currentPrice || rec.basePrice}
                      </td>

                      {/* Recommended Rate */}
                      <td>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          ${rec.recommendedPrice}
                        </span>
                      </td>

                      {/* Delta */}
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isPositive ? 'var(--emerald-bg)' : 'var(--rose-bg)',
                            color: isPositive ? 'var(--emerald)' : 'var(--rose)',
                            border: isPositive ? '1px solid var(--emerald-border)' : '1px solid var(--rose-border)',
                          }}
                        >
                          {isPositive ? `+$${diff}` : `-$${Math.abs(diff)}`}
                        </span>
                      </td>

                      {/* Trigger Reason */}
                      <td>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)', background: '#f8fafc', padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                          ⚡ {rec.triggerReason}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className="status-tag"
                          style={{
                            background:
                              rec.status === 'approved'
                                ? 'var(--emerald-bg)'
                                : rec.status === 'overridden'
                                ? 'var(--gold-bg)'
                                : rec.status === 'rejected'
                                ? 'var(--rose-bg)'
                                : '#fffbeb',
                            color:
                              rec.status === 'approved'
                                ? 'var(--emerald)'
                                : rec.status === 'overridden'
                                ? 'var(--gold-primary)'
                                : rec.status === 'rejected'
                                ? 'var(--rose)'
                                : 'var(--amber)',
                            borderColor:
                              rec.status === 'approved'
                                ? 'var(--emerald-border)'
                                : rec.status === 'overridden'
                                ? 'var(--gold-border)'
                                : rec.status === 'rejected'
                                ? 'var(--rose-border)'
                                : 'var(--amber-border)',
                          }}
                        >
                          ● {rec.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        {canApprove && rec.status === 'pending' ? (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => handleApprove(rec._id)}
                              className="btn-primary"
                              style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--emerald)', borderColor: 'var(--emerald)' }}
                              title="Approve and deploy rate"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleOpenModifyModal(rec)}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              title="Modify rate before approving"
                            >
                              ✏️ Modify
                            </button>
                            <button
                              onClick={() => handleReject(rec._id)}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--rose)', borderColor: 'var(--rose-border)' }}
                              title="Reject recommendation"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                            {rec.reviewedBy ? `Reviewed by ${rec.reviewedBy.name}` : 'Completed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modify Rate Modal */}
      {modifyModalOpen && selectedRec && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <button onClick={() => setModifyModalOpen(false)} className="modal-close">×</button>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Modify Recommended Rate
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Override rate for {selectedRec.productId?.name} on {selectedRec.targetDate}.
            </p>

            {modifyError && <div className="alert alert-danger" style={{ marginBottom: '12px' }}>⚠️ {modifyError}</div>}

            <form onSubmit={handleSaveModify}>
              <div className="form-group">
                <label>Adjusted Rate ($) *</label>
                <input
                  type="number"
                  required
                  value={modifyPrice}
                  onChange={(e) => setModifyPrice(e.target.value)}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                  Product Safeguard Boundaries: ${selectedRec.productId?.minPrice} — ${selectedRec.productId?.maxPrice}
                </span>
              </div>

              <div className="form-group">
                <label>Modification Reason / Review Note</label>
                <input
                  type="text"
                  placeholder="e.g. Competitive rate match, VIP group reservation..."
                  value={modifyNote}
                  onChange={(e) => setModifyNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setModifyModalOpen(false)}
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
                  {submitting ? 'Applying...' : 'Approve Custom Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
