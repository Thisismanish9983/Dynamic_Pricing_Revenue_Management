import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

export default function DashboardShell({ currentRoute, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-deep)', color: 'var(--text-muted)' }}>
        <div>Loading Console...</div>
      </div>
    );
  }

  if (!user) {
    window.location.replace('#/login');
    return null;
  }

  return (
    <div className="app-container">
      <Sidebar currentRoute={currentRoute} />
      <div className="main-content">
        <Navbar />
        <div className="page-scroll">
          {children}
        </div>
      </div>
    </div>
  );
}
