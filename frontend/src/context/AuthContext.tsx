import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('sc_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await authService.me();
      setUser(me);
      localStorage.setItem('sc_user', JSON.stringify(me));
    } catch {
      localStorage.removeItem('sc_token');
      localStorage.removeItem('sc_user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const result = await authService.login({ email, password });
    localStorage.setItem('sc_token', result.token);
    localStorage.setItem('sc_user', JSON.stringify(result.user));
    setUser(result.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await authService.register({ name, email, password });
    localStorage.setItem('sc_token', result.token);
    localStorage.setItem('sc_user', JSON.stringify(result.user));
    setUser(result.user);
  };

  const logout = () => {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
