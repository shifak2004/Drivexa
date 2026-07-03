import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const getAuthErrorMessage = (error, fallback) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) return 'Backend is not reachable. Please start the Drivexa backend and MongoDB.';
  return fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('drivexa_driver_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/profile');
          setUser(response.data.user);
        } catch (error) {
          console.error('Error fetching profile:', error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/driver/login', { email, password });
      const { token: receivedToken, user: loggedUser } = response.data;
      localStorage.setItem('drivexa_driver_token', receivedToken);
      setToken(receivedToken);
      setUser(loggedUser);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        error: getAuthErrorMessage(error, 'Login failed. Please try again.'),
      };
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/driver/signup', userData);
      const { token: receivedToken, user: loggedUser } = response.data;
      localStorage.setItem('drivexa_driver_token', receivedToken);
      setToken(receivedToken);
      setUser(loggedUser);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        error: getAuthErrorMessage(error, 'Signup failed. Please try again.'),
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('drivexa_driver_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
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
