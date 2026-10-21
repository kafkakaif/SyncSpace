const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.status) throw error;
    // Network or server unreachable error
    const netError = new Error('Cannot connect to SyncSpace server. Please ensure the backend is running.');
    netError.status = 0;
    throw netError;
  }
}

export const authApi = {
  signup: async (credentials) => {
    return request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  login: async (credentials) => {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getMe: async (token) => {
    return request('/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  loginDemo: async () => {
    return request('/api/auth/demo', {
      method: 'POST',
    });
  },
};

export default authApi;
