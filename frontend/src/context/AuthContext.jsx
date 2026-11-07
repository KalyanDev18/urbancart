import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('urbancart_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getMe()
        .then((res) => {
          setUser(res.user);
        })
        .catch(() => {
          localStorage.removeItem('urbancart_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const saveAuthSession = (authToken, userData) => {
    localStorage.setItem('urbancart_token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const loginWithOtp = async (email, otp) => {
    const res = await api.verifyOtp(email, otp);
    saveAuthSession(res.token, res.user);
    return res;
  };

  const loginWithPassword = async (username, password) => {
    const res = await api.login(username, password);
    saveAuthSession(res.token, res.user);
    return res;
  };

  const registerUser = async (payload) => {
    const res = await api.register(payload);
    saveAuthSession(res.token, res.user);
    return res;
  };

  const logoutUser = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('urbancart_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        loginWithOtp,
        loginWithPassword,
        registerUser,
        logoutUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
