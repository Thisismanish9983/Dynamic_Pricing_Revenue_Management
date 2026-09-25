// Pure JavaScript API client using native fetch()
const API_BASE = '/api';

export const apiClient = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('dynamic_pricing_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // If session expired or unauthorized
    if (response.status === 401) {
      localStorage.removeItem('dynamic_pricing_token');
      localStorage.removeItem('dynamic_pricing_user');
      if (!window.location.hash.includes('login') && !window.location.hash.includes('register')) {
        window.location.hash = '#/login';
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

export default apiClient;
