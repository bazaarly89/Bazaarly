import React, { createContext, useContext, useEffect, useState } from 'react';
import { Api, AdminApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem('token');
      const adminToken = localStorage.getItem('admin_token');
      if (token) {
        try { const { user } = await Api.me(); setUser(user); }
        catch { localStorage.removeItem('token'); }
      }
      if (adminToken) {
        const cached = localStorage.getItem('admin_profile');
        if (cached) setAdmin(JSON.parse(cached));
      }
      setLoading(false);
    };
    boot();
  }, []);

  const login = async (email, password) => {
    const { token, user } = await Api.login({ email, password });
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const { token, user } = await Api.register(data);
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const adminLogin = async (email, password) => {
    const { token, admin } = await AdminApi.login({ email, password });
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_profile', JSON.stringify(admin));
    setAdmin(admin);
    return admin;
  };

  const adminLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_profile');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, admin, loading, login, register, logout, adminLogin, adminLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
