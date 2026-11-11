import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hms_access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('hms_access_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
          localStorage.setItem('hms_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Failed to load user profile:", err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, []);

  const login = async (username, password) => {
    const res = await authApi.login({ username, password });
    const { access, refresh } = res.data;
    localStorage.setItem('hms_access_token', access);
    localStorage.setItem('hms_refresh_token', refresh);
    setToken(access);

    // Fetch full user profile
    const profileRes = await authApi.getMe();
    setUser(profileRes.data);
    localStorage.setItem('hms_user', JSON.stringify(profileRes.data));
    return profileRes.data;
  };

  const logout = () => {
    localStorage.removeItem('hms_access_token');
    localStorage.removeItem('hms_refresh_token');
    localStorage.removeItem('hms_user');
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('hms_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
        updateUser,
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
