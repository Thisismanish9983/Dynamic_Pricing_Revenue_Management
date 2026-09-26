import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardShell from './components/DashboardShell';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardOverview from './pages/DashboardOverview';
import UsersRoles from './pages/UsersRoles';
import Settings from './pages/Settings';
import MilestonePlaceholder from './pages/MilestonePlaceholder';

function getRouteFromHash() {
  const rawHash = window.location.hash || '';
  const clean = rawHash.replace(/^#\/?/, '').trim();

  // Root or empty hash maps to landing
  if (!clean || clean === '' || clean === '/') {
    return 'landing';
  }

  // Anchor sections on landing page (e.g. #features, #how-it-works, #industries, #rules-engine)
  const landingAnchors = ['features', 'how-it-works', 'industries', 'rules-engine'];
  if (landingAnchors.includes(clean)) {
    return 'landing';
  }

  // Authentication routes
  if (clean === 'login' || clean === 'register') {
    return clean;
  }

  // Protected console routes
  const consoleRoutes = [
    'dashboard', 'users', 'settings', 'products', 
    'rules', 'calendar', 'recommendations', 'analytics', 'notifications'
  ];
  if (consoleRoutes.includes(clean)) {
    return clean;
  }

  // Default fallback to landing page
  return 'landing';
}

function AppContent() {
  const [route, setRoute] = useState(getRouteFromHash);
  const { user } = useAuth();

  useEffect(() => {
    const handleNavigation = () => {
      setRoute(getRouteFromHash());
    };

    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  // 1. Landing Page (First page visitor sees before login/signup)
  if (route === 'landing') {
    return <LandingPage />;
  }

  // 2. Public Authentication Routes
  if (route === 'login') {
    return <Login />;
  }

  if (route === 'register') {
    return <Register />;
  }

  // 3. Protected Operations Console Routes (inside DashboardShell)
  return (
    <DashboardShell currentRoute={route}>
      {route === 'dashboard' && <DashboardOverview />}
      {route === 'users' && <UsersRoles />}
      {route === 'settings' && <Settings />}

      {route === 'products' && (
        <MilestonePlaceholder
          milestone="Milestone 2"
          title="Products & Inventory Management"
          description="Centralized inventory tracking with base prices, capacity, occupancy limits, and location metadata."
          deliverables={[
            'Product / service creation & categories',
            'Base pricing and Min/Max guardrail limits',
            'Availability & Occupancy calculation',
            'Multi-tenant inventory isolation',
          ]}
        />
      )}

      {route === 'rules' && (
        <MilestonePlaceholder
          milestone="Milestone 2"
          title="Dynamic Pricing Rules Engine"
          description="Configure custom conditional rules to adjust rates automatically based on occupancy thresholds, seasonal shifts, and day of week."
          deliverables={[
            'Rule condition builder (Occupancy > 80%, Weekend +20%)',
            'Seasonal and holiday rate schedules',
            'Rule priority ordering & stacking',
            'Min/Max hard pricing boundaries enforcement',
          ]}
        />
      )}

      {route === 'calendar' && (
        <MilestonePlaceholder
          milestone="Milestone 3"
          title="Interactive Price Calendar"
          description="Full-month rate matrix across dates and room categories with occupancy heatmaps and manual overrides."
          deliverables={[
            'Calendar grid across days and weeks',
            'Real-time comparison: Base vs Recommended Rate',
            'Identify surge and high-demand dates',
            'Manual rate override modal with audit logging',
          ]}
        />
      )}

      {route === 'recommendations' && (
        <MilestonePlaceholder
          milestone="Milestone 3"
          title="Price Approval & Override Workflow"
          description="Review queue for Revenue Managers to inspect algorithmically computed price suggestions before publishing."
          deliverables={[
            'Manager review & approval queue',
            'One-click rate approval, modification, or rejection',
            'Historical audit log of all pricing decisions',
            'Rate publish status synchronization',
          ]}
        />
      )}

      {route === 'analytics' && (
        <MilestonePlaceholder
          milestone="Milestone 4"
          title="Revenue Analytics & AI Insights"
          description="Comprehensive revenue forecasting, demand anomaly detection, and interactive charts."
          deliverables={[
            'Revenue trends and occupancy charts',
            'AI price recommendation explanations',
            'Anomaly detection (rapid occupancy shifts)',
            'CSV & PDF export capabilities',
          ]}
        />
      )}

      {route === 'notifications' && (
        <MilestonePlaceholder
          milestone="Milestone 4"
          title="Notifications & Anomaly Alerts"
          description="Real-time alert dispatching for occupancy thresholds, pricing rule conflicts, and limit triggers."
          deliverables={[
            'High-demand surge alerts',
            'Low-occupancy promotional triggers',
            'Price floor and ceiling limit breaches',
            'In-app and email alert preferences',
          ]}
        />
      )}
    </DashboardShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
