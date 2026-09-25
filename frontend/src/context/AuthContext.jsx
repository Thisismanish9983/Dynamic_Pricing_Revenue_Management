import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('dynamic_pricing_token') || null);
  const [loading, setLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    const fetchSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/auth/me');
        if (res.success) {
          setUser(res.user);
          setOrganization(res.user.organization);
        }
      } catch (err) {
        console.error('Session validation error:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [token]);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.success) {
      localStorage.setItem('dynamic_pricing_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setOrganization(res.user.organization);
      return res;
    }
  };

  const register = async (formData) => {
    const res = await apiClient.post('/auth/register', formData);
    if (res.success) {
      localStorage.setItem('dynamic_pricing_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setOrganization(res.user.organization);
      return res;
    }
  };

  const logout = () => {
    localStorage.removeItem('dynamic_pricing_token');
    setToken(null);
    setUser(null);
    setOrganization(null);
    window.location.hash = '#/login';
  };

  const isAdmin = user?.role === 'admin';
  const isRevenueManager = user?.role === 'revenue_manager';
  const isStaff = user?.role === 'staff';
  const isViewer = user?.role === 'viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isRevenueManager,
        isStaff,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
