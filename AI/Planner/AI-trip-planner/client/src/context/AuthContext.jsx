import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: Login function with proper error handling
  const login = async (jwtToken) => {
    try {
      console.log('🔐 Logging in with token...');
      
      setToken(jwtToken);
      localStorage.setItem('token', jwtToken); // persist token

      // ✅ FIX: Use full backend URL
      const res = await axios.get('https://ai-trip-planner-backend-4ga2.onrender.com/api/auth/user', {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });

      console.log('✅ User fetched:', res.data.user);
      setUser(res.data.user);
      setLoading(false);
      
      return res.data.user; // ✅ FIX: Return user for promise handling
    } catch (err) {
      console.error('❌ Login failed:', err.response?.data || err.message);
      logout();
      throw err; // ✅ FIX: Throw error so Dashboard can catch it
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setLoading(false);
  };

  // ✅ FIX: Load token from localStorage on first load with better error handling
  useEffect(() => {
    const initAuth = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');

  if (urlToken) {
    console.log('🔑 Token found in URL');
    await login(urlToken);

    window.history.replaceState({}, document.title, '/dashboard');
    return;
  }

  const savedToken = localStorage.getItem('token');
      
      if (savedToken) {
        console.log('🔑 Found saved token, attempting to restore session...');
        try {
          await login(savedToken);
        } catch (err) {
          console.error('❌ Failed to restore session:', err);
          setLoading(false);
        }
      } else {
        console.log('ℹ️ No saved token found');
        setLoading(false);
      }
    };

    initAuth();
  }, []); // ✅ FIX: Empty dependency array to run only once

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}