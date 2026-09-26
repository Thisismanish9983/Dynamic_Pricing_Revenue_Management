// Pure JavaScript API client using native fetch()
const API_BASE = import.meta.env.VITE_API_URL || '/api';

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

    let data;
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text || `HTTP error ${response.status}` };
    }

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

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

export default apiClient;
