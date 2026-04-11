import React, { createContext, useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from local storage securely
    const storedToken = localStorage.getItem('chat_token');
    const storedUser = localStorage.getItem('chat_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem('chat_token', data.data.token);
      localStorage.setItem('chat_user', JSON.stringify(data.data.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem('chat_token', data.data.token);
      localStorage.setItem('chat_user', JSON.stringify(data.data.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
