import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, authStorage } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    collegeId: string;
    phone?: string;
    department?: string;
    role?: 'student' | 'admin';
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = authStorage.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getCurrentUser();
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid, clearing token');
      authStorage.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await api.login({ email, password: pass });
    authStorage.setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    collegeId: string;
    phone?: string;
    department?: string;
    role?: 'student' | 'admin';
  }): Promise<User> => {
    const res = await api.register(payload);
    authStorage.setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
