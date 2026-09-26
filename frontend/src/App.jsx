import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardShell from './components/DashboardShell';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardOverview from './pages/DashboardOverview';
import UsersRoles from './pages/UsersRoles';
import Settings from './pages/Settings';
import Products from './pages/Products';
import PricingRules from './pages/PricingRules';
import PriceCalendar from './pages/PriceCalendar';
import Recommendations from './pages/Recommendations';
import RevenueAnalytics from './pages/RevenueAnalytics';
import Notifications from './pages/Notifications';

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

      {route === 'products' && <Products />}
      {route === 'rules' && <PricingRules />}

      {route === 'calendar' && <PriceCalendar />}
      {route === 'recommendations' && <Recommendations />}
      {route === 'analytics' && <RevenueAnalytics />}
      {route === 'notifications' && <Notifications />}
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
