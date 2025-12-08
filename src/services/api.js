  // IP Whitelist Management (admin)
  getUserIPs: (userId) =>
    apiRequest(`/api/ip-whitelist/user/${userId}`, { method: 'GET' }),
  addUserIP: (userId, ip_address) =>
    apiRequest(`/api/ip-whitelist/user/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ ip_address }),
    }),
  removeUserIP: (userId, ip) =>
    apiRequest(`/api/ip-whitelist/user/${userId}/${ip}`, { method: 'DELETE' }),
import { io } from 'socket.io-client';

// Default to backend dev port 3000 (see README); override via VITE_API_URL / VITE_WS_URL in .env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

// Token management
let authToken = localStorage.getItem('authToken');

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const getAuthToken = () => authToken;

// API request wrapper
const apiRequest = async (endpoint, options = {}) => {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
  };

  console.log('Making request to:', `${API_URL}${endpoint}`);
  
  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  console.log('Response status:', response.status);
  
  const data = await response.json();

  if (!response.ok) {
    console.error('API Error:', data);
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

// Authentication API
export const authAPI = {
  register: (userData) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  verifyEmail: (token) =>
    apiRequest('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  requestPasswordReset: (email) =>
    apiRequest('/api/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: ({ email, code, newPassword }) =>
    apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    }),

  setup2FA: () => apiRequest('/api/auth/2fa/setup', { method: 'POST' }),

  verify2FA: (code) =>
    apiRequest('/api/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  disable2FA: (password) =>
    apiRequest('/api/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  sendVerificationCode: (email, phone, method = 'email') =>
    apiRequest('/api/auth/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email, phone, method }),
    }),

  verifyCode: (email, phone, code) =>
    apiRequest('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, phone, code }),
    }),

  verifyRegistration: (data) =>
    apiRequest('/api/auth/verify-registration', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// User API
export const userAPI = {
  getProfile: () => apiRequest('/api/users/profile'),

  updateProfile: (profileData) =>
    apiRequest('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  getSettings: () => apiRequest('/api/users/settings'),

  updateSettings: (settings) =>
    apiRequest('/api/users/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getMT5Accounts: () => apiRequest('/api/users/mt5-accounts'),

  addMT5Account: (accountData) =>
    apiRequest('/api/users/mt5-accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    }),

  getRobotConfigs: () => apiRequest('/api/users/robot-configs'),

  updateRobotConfig: (robotId, config) =>
    apiRequest(`/api/users/robot-configs/${robotId}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
};

// Trade API
export const tradeAPI = {
  getTrades: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/api/trades?${params}`);
  },

  getTradeStats: () => apiRequest('/api/trades/stats'),

  createTrade: (tradeData) =>
    apiRequest('/api/trades', {
      method: 'POST',
      body: JSON.stringify(tradeData),
    }),

  closeTrade: (tradeId, closeData) =>
    apiRequest(`/api/trades/${tradeId}/close`, {
      method: 'PUT',
      body: JSON.stringify(closeData),
    }),

  getRobots: () => apiRequest('/api/trades/robots'),
};

// Payment API
export const paymentAPI = {
  createCheckoutSession: (plan) =>
    apiRequest('/api/payments/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),

  createPortalSession: () =>
    apiRequest('/api/payments/create-portal-session', {
      method: 'POST',
    }),
};

// WebSocket Management
let socket = null;

export const websocket = {
  connect: (token) => {
    if (socket?.connected) {
      return socket;
    }

    socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  on: (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  },

  off: (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  },

  emit: (event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  },

  getSocket: () => socket,
};

// Health check
export const healthCheck = () => apiRequest('/health');

export default {
  authAPI,
  userAPI,
  tradeAPI,
  paymentAPI,
  websocket,
  setAuthToken,
  getAuthToken,
  healthCheck,
};
