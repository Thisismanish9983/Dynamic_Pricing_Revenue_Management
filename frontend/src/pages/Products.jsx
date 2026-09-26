import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  IconProducts,
  IconDollar,
  IconPercent,
  IconTrendingUp,
} from '../components/Icons';

export default function Products() {
  const { user, isAdmin, isRevenueManager } = useAuth();
  const canManageProducts = isAdmin || isRevenueManager;
  const canUpdateOccupancy = isAdmin || isRevenueManager || user?.role === 'staff';

  const [products, setProducts] = useState([]);
  const [kpis, setKpis] = useState({
    totalInventory: 0,
    totalCapacity: 0,
    totalOccupied: 0,
    averageOccupancy: 0,
    totalRevenueRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Deluxe Suite',
    description: '',
    basePrice: 200,
    minPrice: 120,
    maxPrice: 400,
    capacity: 20,
    occupiedUnits: 0,
    location: 'Ocean Wing',
    status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await apiClient.get(`/products?${params.toString()}`);
      if (res.success) {
        setProducts(res.products || []);
        if (res.kpis) setKpis(res.kpis);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Deluxe Suite',
      description: '',
      basePrice: 200,
      minPrice: 120,
      maxPrice: 400,
      capacity: 20,
      occupiedUnits: 0,
      location: 'Main Tower',
      status: 'active',
    });
    setModalError('');
    setModalSuccess('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      description: p.description || '',
      basePrice: p.basePrice,
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
      capacity: p.capacity,
      occupiedUnits: p.occupiedUnits,
      location: p.location || '',
      status: p.status || 'active',
    });
    setModalError('');
    setModalSuccess('');
    setModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    // Guardrail validations
    const base = Number(formData.basePrice);
    const min = Number(formData.minPrice);
    const max = Number(formData.maxPrice);

    if (min > base || base > max) {
      setModalError('Invalid limits: Floor (Min) Price must be ≤ Base Price ≤ Ceiling (Max) Price.');
      return;
    }

    if (Number(formData.occupiedUnits) > Number(formData.capacity)) {
      setModalError('Occupied units cannot exceed total capacity.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingProduct) {
        const res = await apiClient.put(`/products/${editingProduct._id}`, formData);
        if (res.success) {
          setModalSuccess('Product updated successfully!');
          setTimeout(() => {
            setModalOpen(false);
            fetchProducts();
          }, 800);
        }
      } else {
        const res = await apiClient.post('/products', formData);
        if (res.success) {
          setModalSuccess('Product created successfully!');
          setTimeout(() => {
            setModalOpen(false);
            fetchProducts();
          }, 800);
        }
      }
    } catch (err) {
      setModalError(err.message || 'Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await apiClient.delete(`/products/${id}`);
      if (res.success) {
        setProducts(products.filter((p) => p._id !== id));
        fetchProducts();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleOccupancyQuickStep = async (productId, change) => {
    if (!canUpdateOccupancy) return;
    try {
      const res = await apiClient.patch(`/products/${productId}/occupancy`, { change });
      if (res.success && res.product) {
        setProducts((prev) =>
          prev.map((p) => (p._id === productId ? res.product : p))
        );
        // Refresh aggregate KPIs
        fetchProducts();
      }
    } catch (err) {
      alert(err.message || 'Failed to adjust occupancy');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div className="card banner-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="milestone-tag active">Milestone 2</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>
              Multi-Tenant Inventory & Safeguards
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Products & Inventory Management
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configure base inventory, hard floor/ceiling price limits, and manage live occupancy.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchProducts} className="btn-secondary" title="Reload live data">
            ↻ Refresh
          </button>
          {canManageProducts && (
            <button onClick={handleOpenCreateModal} className="btn-primary">
              + Add New Inventory
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        {/* KPI 1: Total Inventory */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Total Inventory Types</span>
            <span style={{ padding: '6px', background: 'var(--gold-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconProducts size={16} color="var(--gold-primary)" />
            </span>
          </div>
          <div className="card-value">{kpis.totalInventory}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Configured revenue assets
          </div>
        </div>

        {/* KPI 2: Total Capacity & Occupied */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Total Capacity / In-Use</span>
            <span style={{ padding: '6px', background: 'var(--sapphire-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconTrendingUp size={16} color="var(--sapphire)" />
            </span>
          </div>
          <div className="card-value">
            {kpis.totalOccupied} <span style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: '500' }}>/ {kpis.totalCapacity} units</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {kpis.totalCapacity - kpis.totalOccupied} units available
          </div>
        </div>

        {/* KPI 3: Occupancy Rate */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Average Occupancy</span>
            <span style={{ padding: '6px', background: 'var(--emerald-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconPercent size={16} color="var(--emerald)" />
            </span>
          </div>
          <div className="card-value">
            {kpis.averageOccupancy}%
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, kpis.averageOccupancy)}%`,
                background:
                  kpis.averageOccupancy >= 80
                    ? 'linear-gradient(90deg, #059669, #10b981)'
                    : 'linear-gradient(90deg, #3b82f6, #2563eb)',
              }}
            />
          </div>
        </div>

        {/* KPI 4: Daily Revenue Run-Rate */}
        <div className="card">
          <div className="card-header-row">
            <span className="card-title-sm">Live Revenue Run-Rate</span>
            <span style={{ padding: '6px', background: 'var(--amber-bg)', borderRadius: 'var(--radius-xs)' }}>
              <IconDollar size={16} color="var(--amber)" />
            </span>
          </div>
          <div className="card-value">${Number(kpis.totalRevenueRate || 0).toLocaleString()}</div>
          <div style={{ fontSize: '11px', color: 'var(--emerald)', marginTop: '6px', fontWeight: '600' }}>
            ● Real-time occupied revenue
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px' }}>
            <input
              type="text"
              placeholder="Search by inventory name, category, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="all">All Categories</option>
              <option value="Standard Suite">Standard Suite</option>
              <option value="Deluxe Suite">Deluxe Suite</option>
              <option value="Executive Suite">Executive Suite</option>
              <option value="Presidential Suite">Presidential Suite</option>
              <option value="Beach Villa">Beach Villa</option>
            </select>
          </div>

          <div style={{ width: '150px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button type="submit" className="btn-secondary">
            Filter
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: '0px' }}>
        <div style={{ padding: '18px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Inventory Units & Dynamic Safeguards ({products.length})
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Base pricing is strictly clamped between Min and Max safeguards. Staff can update occupied rooms.
            </span>
          </div>

          {canUpdateOccupancy && (
            <span style={{ fontSize: '11px', color: 'var(--gold-primary)', background: 'var(--gold-bg)', padding: '4px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--gold-border)', fontWeight: '600' }}>
              ✓ Live Occupancy Steppers Enabled
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading inventory items...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No products or inventory match the current filters.
          </div>
        ) : (
          <div className="table-responsive" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Product / Room</th>
                  <th>Category</th>
                  <th>Base Rate</th>
                  <th>Guardrails (Min / Max)</th>
                  <th>Live Dynamic Price</th>
                  <th>Occupancy (Used / Total)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const cap = p.capacity || 1;
                  const occ = p.occupiedUnits || 0;
                  const occPercent = Math.round((occ / cap) * 100);
                  const priceDiff = (p.currentPrice || p.basePrice) - p.basePrice;

                  return (
                    <tr key={p._id}>
                      {/* Name & Location */}
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          📍 {p.location || 'Main Property'}
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-xs)',
                            background: '#f1f5f9',
                            color: 'var(--text-light)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {p.category}
                        </span>
                      </td>

                      {/* Base Price */}
                      <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>
                        ${p.basePrice}
                      </td>

                      {/* Guardrails (Min / Max) */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'monospace', background: '#f8fafc', padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ color: 'var(--rose)', fontWeight: '700' }}>${p.minPrice}</span>
                          <span style={{ color: 'var(--text-dim)' }}>—</span>
                          <span style={{ color: 'var(--emerald)', fontWeight: '700' }}>${p.maxPrice}</span>
                        </div>
                      </td>

                      {/* Live Dynamic Price */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            ${p.currentPrice || p.basePrice}
                          </span>
                          {priceDiff > 0 && (
                            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--emerald)', background: 'var(--emerald-bg)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--emerald-border)' }}>
                              +${priceDiff}
                            </span>
                          )}
                          {priceDiff < 0 && (
                            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--rose)', background: 'var(--rose-bg)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--rose-border)' }}>
                              -${Math.abs(priceDiff)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Occupancy Stepper */}
                      <td style={{ minWidth: '180px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {canUpdateOccupancy && (
                            <button
                              type="button"
                              onClick={() => handleOccupancyQuickStep(p._id, -1)}
                              disabled={occ <= 0}
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-light)',
                                background: '#fff',
                                cursor: occ <= 0 ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: '700',
                                color: occ <= 0 ? 'var(--text-dim)' : 'var(--text-primary)',
                              }}
                              title="Decrease occupied units (-1)"
                            >
                              -
                            </button>
                          )}

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600' }}>
                              <span>{occ} / {cap}</span>
                              <span style={{ color: occPercent >= 80 ? 'var(--emerald)' : 'var(--text-muted)' }}>
                                {occPercent}%
                              </span>
                            </div>
                            <div className="progress-bar-bg" style={{ height: '4px', marginTop: '4px' }}>
                              <div
                                className="progress-bar-fill"
                                style={{
                                  width: `${Math.min(100, occPercent)}%`,
                                  background: occPercent >= 80 ? 'var(--emerald)' : 'var(--gold-primary)',
                                }}
                              />
                            </div>
                          </div>

                          {canUpdateOccupancy && (
                            <button
                              type="button"
                              onClick={() => handleOccupancyQuickStep(p._id, 1)}
                              disabled={occ >= cap}
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-light)',
                                background: '#fff',
                                cursor: occ >= cap ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: '700',
                                color: occ >= cap ? 'var(--text-dim)' : 'var(--text-primary)',
                              }}
                              title="Increase occupied units (+1)"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className="status-tag"
                          style={{
                            background:
                              p.status === 'active'
                                ? 'var(--emerald-bg)'
                                : p.status === 'maintenance'
                                ? 'var(--amber-bg)'
                                : '#f1f5f9',
                            color:
                              p.status === 'active'
                                ? 'var(--emerald)'
                                : p.status === 'maintenance'
                                ? 'var(--amber)'
                                : 'var(--text-muted)',
                            borderColor:
                              p.status === 'active'
                                ? 'var(--emerald-border)'
                                : p.status === 'maintenance'
                                ? 'var(--amber-border)'
                                : 'var(--border-subtle)',
                          }}
                        >
                          ● {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {canManageProducts && (
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                            >
                              Edit
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteProduct(p._id, p.name)}
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

      {/* Product Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <button onClick={() => setModalOpen(false)} className="modal-close">×</button>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {editingProduct ? 'Edit Inventory Unit' : 'Create New Inventory Unit'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Configure pricing safeguards and unit capacity for dynamic revenue algorithms.
            </p>

            {modalError && <div className="alert alert-danger" style={{ marginBottom: '14px' }}>⚠️ {modalError}</div>}
            {modalSuccess && <div className="alert alert-success" style={{ marginBottom: '14px' }}>✓ {modalSuccess}</div>}

            <form onSubmit={handleSaveProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Product / Room Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deluxe Ocean View Suite"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Standard Suite">Standard Suite</option>
                    <option value="Deluxe Suite">Deluxe Suite</option>
                    <option value="Executive Suite">Executive Suite</option>
                    <option value="Presidential Suite">Presidential Suite</option>
                    <option value="Beach Villa">Beach Villa</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Location / Wing</label>
                  <input
                    type="text"
                    placeholder="e.g. Ocean Wing Floor 4"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Operational Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active (Available for booking)</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Pricing Guardrails Section */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Pricing Guardrails & Safe Limits ($)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ color: 'var(--rose)' }}>Min Floor Price ($) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.minPrice}
                      onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ color: 'var(--gold-primary)' }}>Base Target Price ($) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ color: 'var(--emerald)' }}>Max Ceiling Price ($) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.maxPrice}
                      onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '8px' }}>
                  Safeguard Rule: Algorithms will never drop rate below ${formData.minPrice} or surge beyond ${formData.maxPrice}.
                </div>
              </div>

              {/* Capacity and Occupancy */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Total Unit Capacity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Occupied Units Now</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.capacity}
                    value={formData.occupiedUnits}
                    onChange={(e) => setFormData({ ...formData, occupiedUnits: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description / Amenities</label>
                <textarea
                  rows="2"
                  placeholder="Optional room specs, view description, or unit notes..."
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
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
