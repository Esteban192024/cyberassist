/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { fetchUserProgress, invalidateUserProgressCache } from '../utils/progressHelper';
import { invalidateUserCache } from '../store/userStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');
    if (token && storedUser) {
      return JSON.parse(storedUser);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      if (user) {
        await fetchUserProgress();
      }
      setLoading(false);
    }

    loadSession()
  }, [user]);

  const login = async (email, password) => {
    try {
      // Invalidate ALL caches before logging in new user
      invalidateUserCache();
      invalidateUserProgressCache();
      
      const response = await authAPI.login({ email, password });
      const { user: userData, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setUser(userData);
      
      // Cargar progreso desde backend para sincronización entre dispositivos
      await fetchUserProgress();
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al iniciar sesión'
      };
    }
  };

  const register = async (email, password, nombre) => {
    try {
      // Invalidate ALL caches before registering new user
      invalidateUserCache();
      invalidateUserProgressCache();
      
      const response = await authAPI.register({ email, password, nombre });
      const { user: userData, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setUser(userData);
      
      // Cargar progreso desde backend para sincronización entre dispositivos
      await fetchUserProgress();
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al registrar usuario'
      };
    }
  };

  const logout = () => {
    // Invalidate ALL caches when logging out
    invalidateUserCache();
    invalidateUserProgressCache();
    
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    setUser(newUser);
    invalidateUserCache(); // Invalidate user store cache to refresh stats
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user
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
