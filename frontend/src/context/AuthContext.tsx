'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  accountType?: string;
  employeeId?: string;
  isActive?: boolean;
  // Principal details
  principalName?: string;
  principalDesignation?: string;
  principalOrganization?: string;
  principalAddress?: string;
  principalSignatureUrl?: string;
  principalSealUrl?: string;
  // Assistant details
  assistantName?: string;
  assistantRole?: string;
  assistantContact?: string;
  // Regular / legacy fields
  designation?: string;
  department?: string;
  organization?: string;
  defaultAddress?: string;
  // Operator
  operatorRole?: string;
  parentUserId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateAssistantDetails: (data: any) => Promise<void>;
  updatePrincipalDetails: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (t: string) => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
    router.push('/dashboard');
  };

  const register = async (data: any) => {
    const res = await api.post('/auth/register', data);
    const { token: t, user: u } = res.data;
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await api.put('/auth/profile', data);
    setUser(res.data);
  };

  const updateAssistantDetails = async (data: any) => {
    const res = await api.put('/auth/assistant', data);
    setUser(res.data);
  };

  const updatePrincipalDetails = async (data: any) => {
    const res = await api.put('/auth/principal', data);
    setUser(res.data);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, updateAssistantDetails, updatePrincipalDetails }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
