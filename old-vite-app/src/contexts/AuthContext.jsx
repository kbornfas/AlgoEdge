import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, setAuthToken, getAuthToken, websocket } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // Verify token is still valid by fetching user profile
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { userAPI } = await import('../services/api');
      const profile = await userAPI.getProfile();
      setUser(profile.user);
      setIsAuthenticated(true);
      
      // Connect WebSocket
      websocket.connect(getAuthToken());
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Token invalid, clear auth
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      setAuthToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Connect WebSocket
      websocket.connect(response.token);
      
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      setAuthToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      
      return { success: true, user: response.user, message: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
    websocket.disconnect();
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshProfile: fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
