import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ai_interview_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
        } catch (err) {
          console.warn('Session expired, logging in demo candidate');
          await autoDemoLogin();
        }
      } else {
        await autoDemoLogin();
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const autoDemoLogin = async () => {
    try {
      const res = await authAPI.demoLogin();
      localStorage.setItem('ai_interview_token', res.data.access_token);
      setToken(res.data.access_token);
      setUser(res.data.user);
    } catch (err) {
      console.error('Demo login error:', err);
    }
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('ai_interview_token', res.data.access_token);
    setToken(res.data.access_token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    localStorage.setItem('ai_interview_token', res.data.access_token);
    setToken(res.data.access_token);
    setUser(res.data.user);
    return res.data;
  };

  const demoLogin = async () => {
    const res = await authAPI.demoLogin();
    localStorage.setItem('ai_interview_token', res.data.access_token);
    setToken(res.data.access_token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('ai_interview_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, register, demoLogin, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
