import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  IconRules,
  IconTrendingUp,
  IconPercent,
  IconDollar,
  IconShield,
} from '../components/Icons';

export default function PricingRules() {
  const { isAdmin, isRevenueManager } = useAuth();
  const canManageRules = isAdmin || isRevenueManager;

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Simulation State
  const [simulationData, setSimulationData] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [applyingRates, setApplyingRates] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ruleType: 'occupancy',
    conditions: {
      occupancyThreshold: 80,
      occupancyOperator: '>=',
      daysOfWeek: ['Friday', 'Saturday', 'Sunday'],
      seasonStart: '',
      seasonEnd: '',
    },
    action: {
      adjustmentType: 'percentage_increase',
      adjustmentValue: 15,
    },
    priority: 1,
    isActive: true,
    enforceClamping: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/rules');
      if (res.success) {
        setRules(res.rules || []);
      }
    } catch (err) {
      console.error('Failed to fetch pricing rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleRunSimulation = async () => {
    try {
      setSimulating(true);
      setApplySuccessMsg('');
      const res = await apiClient.get('/rules/simulate');
      if (res.success) {
        setSimulationData(res);
      }
    } catch (err) {
      alert(err.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleApplyRatesToLive = async () => {
    if (!canManageRules) return;
    if (!window.confirm('Apply recommended dynamic rates to live product inventory now?')) return;

    try {
      setApplyingRates(true);
      const res = await apiClient.post('/rules/apply', {});
      if (res.success) {
        setApplySuccessMsg(res.message);
        // Refresh simulation to reflect new baseline
        handleRunSimulation();
      }
    } catch (err) {
      alert(err.message || 'Failed to apply rates');
    } finally {
      setApplyingRates(false);
    }
  };

  const handleToggleRule = async (ruleId) => {
    if (!canManageRules) return;
    try {
      const res = await apiClient.patch(`/rules/${ruleId}/toggle`, {});
      if (res.success) {
        setRules((prev) =>
          prev.map((r) => (r._id === ruleId ? { ...r, isActive: res.rule.isActive } : r))
        );
        // If simulation is active, rerun it to see updated results
        if (simulationData) {
          handleRunSimulation();
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle rule');
    }
  };

  const handleDeleteRule = async (ruleId, name) => {
    if (!canManageRules) return;
    if (!window.confirm(`Delete rule "${name}"?`)) return;

    try {
      const res = await apiClient.delete(`/rules/${ruleId}`);
      if (res.success) {
        setRules(rules.filter((r) => r._id !== ruleId));
        if (simulationData) handleRunSimulation();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete rule');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      ruleType: 'occupancy',
      conditions: {
        occupancyThreshold: 80,
        occupancyOperator: '>=',
        daysOfWeek: ['Friday', 'Saturday', 'Sunday'],
        seasonStart: '',
        seasonEnd: '',
      },
      action: {
        adjustmentType: 'percentage_increase',
        adjustmentValue: 15,
      },
      priority: 1,
      isActive: true,
      enforceClamping: true,
    });
    setModalError('');
    setModalSuccess('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (r) => {
    setEditingRule(r);
    setFormData({
      name: r.name,
      description: r.description || '',
      ruleType: r.ruleType || 'occupancy',
      conditions: {
        occupancyThreshold: r.conditions?.occupancyThreshold ?? 80,
        occupancyOperator: r.conditions?.occupancyOperator || '>=',
        daysOfWeek: r.conditions?.daysOfWeek || ['Friday', 'Saturday', 'Sunday'],
        seasonStart: r.conditions?.seasonStart ? r.conditions.seasonStart.split('T')[0] : '',
        seasonEnd: r.conditions?.seasonEnd ? r.conditions.seasonEnd.split('T')[0] : '',
      },
      action: {
        adjustmentType: r.action?.adjustmentType || 'percentage_increase',
        adjustmentValue: r.action?.adjustmentValue || 15,
      },
      priority: r.priority || 1,
      isActive: r.isActive !== false,
      enforceClamping: r.enforceClamping !== false,
    });
    setModalError('');
    setModalSuccess('');
    setModalOpen(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!formData.name.trim()) {
      setModalError('Rule name is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingRule) {
        const res = await apiClient.put(`/rules/${editingRule._id}`, formData);
        if (res.success) {
          setModalSuccess('Rule updated successfully!');
          setTimeout(() => {
            setModalOpen(false);
            fetchRules();
            if (simulationData) handleRunSimulation();
          }, 800);
        }
      } else {
        const res = await apiClient.post('/rules', formData);
        if (res.success) {
          setModalSuccess('Rule created successfully!');
          setTimeout(() => {
            setModalOpen(false);
            fetchRules();
            if (simulationData) handleRunSimulation();
          }, 800);
        }
      }
    } catch (err) {
      setModalError(err.message || 'Error saving rule');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRules = rules.filter((r) => {
    if (activeTab === 'all') return true;
    return r.ruleType === activeTab;
  });

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div className="card banner-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="milestone-tag active">Milestone 2</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>
              Autonomous Revenue Optimization
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Dynamic Pricing Rules Engine
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configure conditional yield rules (occupancy triggers, weekend surges, seasonal shifts) with hard floor/ceiling limits.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="btn-secondary"
            style={{ borderColor: 'var(--gold-primary)', color: 'var(--gold-primary)' }}
          >
            {simulating ? 'Evaluating...' : '⚡ Simulate Live Rates'}
          </button>

          {canManageRules && (
            <button onClick={handleOpenCreateModal} className="btn-primary">
              + Create Pricing Rule
            </button>
          )}
        </div>
      </div>

      {/* Rules Engine Status Banner */}
      <div className="grid-4">
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Configured Rules</span>
            <span style={{ padding: '6px', background: 'var(--gold-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconRules size={16} color="var(--gold-primary)" />
            </span>
          </div>
          <div className="card-value">{rules.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {rules.filter((r) => r.isActive).length} active in production
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Occupancy Triggers</span>
            <span style={{ padding: '6px', background: 'var(--sapphire-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconTrendingUp size={16} color="var(--sapphire)" />
            </span>
          </div>
          <div className="card-value">
            {rules.filter((r) => r.ruleType === 'occupancy' && r.isActive).length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Capacity-driven rate surges
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Weekend Surges</span>
            <span style={{ padding: '6px', background: 'var(--amber-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconDollar size={16} color="var(--amber)" />
            </span>
          </div>
          <div className="card-value">
            {rules.filter((r) => r.ruleType === 'weekend' && r.isActive).length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Fri/Sat/Sun premium multipliers
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Bound Safeguards</span>
            <span style={{ padding: '6px', background: 'var(--emerald-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconShield size={16} color="var(--emerald)" />
            </span>
          </div>
          <div className="card-value" style={{ color: 'var(--emerald)' }}>100%</div>
          <div style={{ fontSize: '11px', color: 'var(--emerald)', marginTop: '6px', fontWeight: '600' }}>
            ● Hard Min/Max Clamping Active
          </div>
        </div>
      </div>

      {/* Live Simulation Drawer / Results (if opened) */}
      {simulationData && (
        <div className="card" style={{ border: '2px solid var(--gold-border)', background: '#fafcff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--gold-primary)' }}>
                  ⚡ Live Simulation & Rate Deployment Console
                </span>
                <span style={{ fontSize: '11px', background: 'var(--emerald-bg)', color: 'var(--emerald)', border: '1px solid var(--emerald-border)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                  Projected Lift: +{simulationData.simulationMeta?.projectedRevenueLiftPercentage}%
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Evaluated {simulationData.simulationMeta?.evaluatedProducts} active inventory units against {simulationData.simulationMeta?.totalActiveRules} active rules.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSimulationData(null)}
                className="btn-secondary"
                style={{ fontSize: '11px' }}
              >
                Close Console
              </button>
              {canManageRules && (
                <button
                  type="button"
                  onClick={handleApplyRatesToLive}
                  disabled={applyingRates}
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #059669, #047857)', borderColor: '#047857' }}
                >
                  {applyingRates ? 'Deploying...' : '🚀 Apply Rates to Live Inventory'}
                </button>
              )}
            </div>
          </div>

          {applySuccessMsg && (
            <div className="alert alert-success" style={{ marginTop: '14px' }}>
              ✓ {applySuccessMsg}
            </div>
          )}

          {/* Simulation Summary Table */}
          <div className="table-responsive" style={{ marginTop: '14px' }}>
            <table>
              <thead>
                <tr>
                  <th>Product / Room</th>
                  <th>Occupancy</th>
                  <th>Base Price</th>
                  <th>Triggered Rule Multipliers</th>
                  <th>Raw Rate</th>
                  <th>Safeguard Clamp</th>
                  <th>Final Live Rate</th>
                </tr>
              </thead>
              <tbody>
                {simulationData.results?.map((item) => (
                  <tr key={item.productId}>
                    <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</td>
                    <td>
                      <span style={{ fontWeight: '600', color: item.occupancyRate >= 80 ? 'var(--emerald)' : 'var(--text-light)' }}>
                        {item.occupancyRate}% ({item.occupiedUnits}/{item.capacity})
                      </span>
                    </td>
                    <td>${item.basePrice}</td>
                    <td>
                      {item.triggeredRules.length === 0 ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>None triggered (base applies)</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {item.triggeredRules.map((tr, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '11px',
                                background: tr.adjustmentDelta >= 0 ? 'var(--emerald-bg)' : 'var(--rose-bg)',
                                color: tr.adjustmentDelta >= 0 ? 'var(--emerald)' : 'var(--rose)',
                                padding: '1px 6px',
                                borderRadius: '3px',
                                display: 'inline-block',
                                width: 'fit-content',
                              }}
                            >
                              {tr.ruleName}: {tr.adjustmentDelta >= 0 ? `+$${tr.adjustmentDelta}` : `-$${Math.abs(tr.adjustmentDelta)}`} ({tr.triggerReason})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>${item.rawPrice}</td>
                    <td>
                      {item.wasClamped ? (
                        <span style={{ fontSize: '11px', color: 'var(--rose)', background: 'var(--rose-bg)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', border: '1px solid var(--rose-border)' }}>
                          🛡️ {item.clampReason}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--emerald)' }}>
                          ✓ Within Bounds (${item.minPrice} - ${item.maxPrice})
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          ${item.recommendedPrice}
                        </span>
                        {item.priceDifference > 0 && (
                          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--emerald)' }}>
                            (+{item.percentageChange}%)
                          </span>
                        )}
                        {item.priceDifference < 0 && (
                          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--rose)' }}>
                            ({item.percentageChange}%)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rules Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'all', label: 'All Rules' },
          { id: 'occupancy', label: 'Occupancy Surges' },
          { id: 'weekend', label: 'Weekend Premiums' },
          { id: 'seasonal', label: 'Seasonal Schedules' },
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

      {/* Rules List */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Active Production Rules ({filteredRules.length})
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Rules are evaluated in order of Priority (highest first). Toggle a switch to activate or deactivate instantly.
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading pricing rules...
          </div>
        ) : filteredRules.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No pricing rules found for this category. Click "+ Create Pricing Rule" to add one.
          </div>
        ) : (
          <div className="table-responsive" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Rule Name</th>
                  <th>Type</th>
                  <th>Condition Trigger</th>
                  <th>Price Action</th>
                  <th>Priority</th>
                  <th>Safeguard Clamping</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => {
                  let conditionText = '';
                  if (rule.ruleType === 'occupancy') {
                    conditionText = `Occupancy ${rule.conditions?.occupancyOperator || '>='} ${rule.conditions?.occupancyThreshold ?? 80}%`;
                  } else if (rule.ruleType === 'weekend') {
                    conditionText = `Days: ${(rule.conditions?.daysOfWeek || []).join(', ')}`;
                  } else if (rule.ruleType === 'seasonal') {
                    const start = rule.conditions?.seasonStart ? new Date(rule.conditions.seasonStart).toLocaleDateString() : 'Start';
                    const end = rule.conditions?.seasonEnd ? new Date(rule.conditions.seasonEnd).toLocaleDateString() : 'End';
                    conditionText = `${start} — ${end}`;
                  } else {
                    conditionText = 'General Custom Condition';
                  }

                  let actionText = '';
                  const val = rule.action?.adjustmentValue || 0;
                  switch (rule.action?.adjustmentType) {
                    case 'percentage_increase':
                      actionText = `+${val}% Surge`;
                      break;
                    case 'percentage_decrease':
                      actionText = `-${val}% Discount`;
                      break;
                    case 'fixed_increase':
                      actionText = `+$${val} Flat`;
                      break;
                    case 'fixed_decrease':
                      actionText = `-$${val} Flat`;
                      break;
                    default:
                      actionText = `+${val}%`;
                  }

                  const isIncrease = rule.action?.adjustmentType?.includes('increase');

                  return (
                    <tr key={rule._id}>
                      {/* Name & Desc */}
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{rule.name}</div>
                        {rule.description && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rule.description}</div>
                        )}
                      </td>

                      {/* Rule Type */}
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-xs)',
                            background:
                              rule.ruleType === 'occupancy'
                                ? 'var(--sapphire-bg)'
                                : rule.ruleType === 'weekend'
                                ? 'var(--amber-bg)'
                                : 'var(--gold-bg)',
                            color:
                              rule.ruleType === 'occupancy'
                                ? 'var(--sapphire)'
                                : rule.ruleType === 'weekend'
                                ? 'var(--amber)'
                                : 'var(--gold-primary)',
                            border: '1px solid var(--border-subtle)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {rule.ruleType}
                        </span>
                      </td>

                      {/* Trigger Condition */}
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-light)', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                          {conditionText}
                        </span>
                      </td>

                      {/* Action */}
                      <td>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '700',
                            color: isIncrease ? 'var(--emerald)' : 'var(--rose)',
                            background: isIncrease ? 'var(--emerald-bg)' : 'var(--rose-bg)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: isIncrease ? '1px solid var(--emerald-border)' : '1px solid var(--rose-border)',
                          }}
                        >
                          {actionText}
                        </span>
                      </td>

                      {/* Priority */}
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          P{rule.priority || 1}
                        </span>
                      </td>

                      {/* Enforce Clamping */}
                      <td>
                        <span style={{ fontSize: '11px', color: rule.enforceClamping !== false ? 'var(--emerald)' : 'var(--rose)', fontWeight: '600' }}>
                          {rule.enforceClamping !== false ? '✓ Enforced' : '✕ Unenforced'}
                        </span>
                      </td>

                      {/* Toggle Active Switch */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule._id)}
                          disabled={!canManageRules}
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: canManageRules ? 'pointer' : 'default',
                            border: rule.isActive ? '1px solid var(--emerald-border)' : '1px solid var(--border-subtle)',
                            background: rule.isActive ? 'var(--emerald-bg)' : '#f1f5f9',
                            color: rule.isActive ? 'var(--emerald)' : 'var(--text-dim)',
                          }}
                        >
                          {rule.isActive ? '● Active' : '○ Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {canManageRules && (
                            <button
                              onClick={() => handleOpenEditModal(rule)}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                            >
                              Edit
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteRule(rule._id, rule.name)}
                              className="btn-secondary"
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                color: 'var(--rose)',
                                borderColor: 'var(--rose-border)',
                              }}
                            >
                              Delete
                            </button>
                          )}
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

      {/* Create / Edit Rule Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <button onClick={() => setModalOpen(false)} className="modal-close">×</button>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {editingRule ? 'Edit Pricing Rule' : 'Create Dynamic Pricing Rule'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Formulate automated triggers to maximize RevPAR while strictly respecting product safe limits.
            </p>

            {modalError && <div className="alert alert-danger" style={{ marginBottom: '14px' }}>⚠️ {modalError}</div>}
            {modalSuccess && <div className="alert alert-success" style={{ marginBottom: '14px' }}>✓ {modalSuccess}</div>}

            <form onSubmit={handleSaveRule}>
              <div className="form-group">
                <label>Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High-Demand Occupancy Surge"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Rule Trigger Type *</label>
                  <select
                    value={formData.ruleType}
                    onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                  >
                    <option value="occupancy">Occupancy Threshold (%)</option>
                    <option value="weekend">Weekend Surge (Days of Week)</option>
                    <option value="seasonal">Seasonal Date Schedule</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Evaluation Priority (Higher = First)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  />
                </div>
              </div>

              {/* Dynamic Condition Builder */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Condition Trigger Configuration
                </div>

                {formData.ruleType === 'occupancy' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Condition Operator</label>
                      <select
                        value={formData.conditions.occupancyOperator}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            conditions: { ...formData.conditions, occupancyOperator: e.target.value },
                          })
                        }
                      >
                        <option value=">=">Greater than or Equal (&gt;=)</option>
                        <option value=">">Strictly Greater (&gt;)</option>
                        <option value="<=">Less than or Equal (&lt;=)</option>
                        <option value="<">Strictly Less (&lt;)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Occupancy Rate Threshold (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.conditions.occupancyThreshold}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            conditions: { ...formData.conditions, occupancyThreshold: Number(e.target.value) },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {formData.ruleType === 'weekend' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px' }}>Active Days of Week</label>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {['Friday', 'Saturday', 'Sunday'].map((day) => {
                        const checked = formData.conditions.daysOfWeek.includes(day);
                        return (
                          <label key={day} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const newDays = e.target.checked
                                  ? [...formData.conditions.daysOfWeek, day]
                                  : formData.conditions.daysOfWeek.filter((d) => d !== day);
                                setFormData({
                                  ...formData,
                                  conditions: { ...formData.conditions, daysOfWeek: newDays },
                                });
                              }}
                            />
                            {day}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {formData.ruleType === 'seasonal' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Season Start Date</label>
                      <input
                        type="date"
                        value={formData.conditions.seasonStart}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            conditions: { ...formData.conditions, seasonStart: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Season End Date</label>
                      <input
                        type="date"
                        value={formData.conditions.seasonEnd}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            conditions: { ...formData.conditions, seasonEnd: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Builder */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Price Action Adjustment
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Adjustment Type</label>
                    <select
                      value={formData.action.adjustmentType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          action: { ...formData.action, adjustmentType: e.target.value },
                        })
                      }
                    >
                      <option value="percentage_increase">Percentage Increase (+%)</option>
                      <option value="percentage_decrease">Percentage Discount (-%)</option>
                      <option value="fixed_increase">Fixed Dollar Surcharge (+$)</option>
                      <option value="fixed_decrease">Fixed Dollar Discount (-$)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Adjustment Value (% or $)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.action.adjustmentValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          action: { ...formData.action, adjustmentValue: Number(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Safeguard Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.enforceClamping}
                    onChange={(e) => setFormData({ ...formData, enforceClamping: e.target.checked })}
                  />
                  <span>
                    <strong>Enforce Min/Max Hard Guardrails</strong> (Recommended: Prevents rate from ever violating product safe limits)
                  </span>
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Activate rule immediately upon saving</span>
                </label>
              </div>

              <div className="form-group">
                <label>Description / Rationale</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Surge rate applied during peak summer season or when property exceeds 80% occupancy..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                  {submitting ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
