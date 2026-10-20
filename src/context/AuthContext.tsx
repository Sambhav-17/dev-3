import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api, getStoredToken, setStoredToken } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const token = getStoredToken();
        if (token) {
          const res = await api.getMe();
          setUser(res.user);
          setIsGuest(res.isGuest);
        } else {
          setIsGuest(true);
          setUser({ id: 'guest_user', name: 'Guest Explorer', email: 'guest@lazyflow.local' });
        }
      } catch {
        setStoredToken(null);
        setIsGuest(true);
        setUser({ id: 'guest_user', name: 'Guest Explorer', email: 'guest@lazyflow.local' });
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setStoredToken(res.token);
      setUser(res.user);
      setIsGuest(false);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.register({ name, email, password });
      setStoredToken(res.token);
      setUser(res.user);
      setIsGuest(false);
    } finally {
      setIsLoading(false);
    }
  };

  const continueAsGuest = () => {
    setStoredToken(null);
    setIsGuest(true);
    setUser({ id: 'guest_user', name: 'Guest Explorer', email: 'guest@lazyflow.local' });
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
      setIsGuest(true);
      setUser({ id: 'guest_user', name: 'Guest Explorer', email: 'guest@lazyflow.local' });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, isLoading, login, register, continueAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
