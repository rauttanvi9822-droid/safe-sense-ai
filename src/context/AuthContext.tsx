import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, DemoModeState, DemoScenario } from '../types';
import { getStoredUser, storeUser, clearUser, mockLogin } from '../lib/mockAuth';
import { apiLogin, apiRegister, apiLogout, apiGetMe } from '../lib/apiClient';
import { useLanguage } from './LanguageContext';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  demoMode: DemoModeState;
  setDemoScenario: (scenario: DemoScenario) => void;
  toggleDemoMode: () => void;
  isBackendAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setLanguage } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const [demoMode, setDemoMode] = useState<DemoModeState>({
    active: false,
    scenario: 'MODERATE',
  });

  // Check backend availability and restore session
  useEffect(() => {
    (async () => {
      setIsLoading(true);

      // Try to restore from API token first
      if (API_URL && localStorage.getItem('safesense_token')) {
        try {
          const apiUser = await apiGetMe();
          // Map API user to app User type (role: 'user' → 'victim' for existing UI compatibility)
          const mappedUser: User = {
            id: apiUser.id,
            email: apiUser.email,
            name: apiUser.name,
            role: apiUser.role === 'user' ? 'victim' : apiUser.role as any,
            language: (apiUser.language ?? 'en') as any,
            createdAt: apiUser.createdAt,
          };
          storeUser(mappedUser);
          setUser(mappedUser);
          setLanguage(mappedUser.language);
          setIsBackendAvailable(true);
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem('safesense_token');
        }
      }

      // Check backend health
      if (API_URL) {
        try {
          const res = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
          setIsBackendAvailable(res.ok);
        } catch {
          setIsBackendAvailable(false);
        }
      }

      // Fall back to localStorage mock session
      const stored = getStoredUser();
      if (stored) setUser(stored);
      setIsLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      // Try real backend first
      if (API_URL) {
        try {
          const { user: apiUser } = await apiLogin(email, password);
          const mappedUser: User = {
            id: apiUser.id,
            email: apiUser.email,
            name: apiUser.name,
            role: apiUser.role === 'user' ? 'victim' : apiUser.role as any,
            language: (apiUser.language ?? 'en') as any,
            createdAt: apiUser.createdAt,
          };
          storeUser(mappedUser);
          setUser(mappedUser);
          setLanguage(mappedUser.language);
          setIsBackendAvailable(true);
          return true;
        } catch (e: any) {
          // If backend is down, try mock login for demo
          if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
            // fall through to mock
          } else {
            setError(e.message ?? 'Login failed');
            return false;
          }
        }
      }

      // Mock login (demo credentials)
      const u = mockLogin(email, password);
      if (!u) {
        setError('Invalid email or password.');
        return false;
      }
      storeUser(u);
      setUser(u);
      setLanguage(u.language);
      return true;
    } catch (e: any) {
      setError(e.message ?? 'An error occurred');
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setError(null);
    if (!API_URL) {
      setError('Registration requires the backend server. Please start the backend and try again.');
      return false;
    }
    try {
      const { user: apiUser } = await apiRegister(email, password, name);
      const mappedUser: User = {
        id: apiUser.id,
        email: apiUser.email,
        name: apiUser.name,
        role: 'victim',
        language: 'en',
        createdAt: apiUser.createdAt,
      };
      storeUser(mappedUser);
      setUser(mappedUser);
      setLanguage(mappedUser.language);
      return true;
    } catch (e: any) {
      setError(e.message ?? 'Registration failed');
      return false;
    }
  };

  const logout = async () => {
    if (API_URL) await apiLogout();
    clearUser();
    setUser(null);
  };

  const setDemoScenario = (scenario: DemoScenario) => {
    setDemoMode((prev) => ({ ...prev, scenario }));
  };

  const toggleDemoMode = () => {
    setDemoMode((prev) => ({ ...prev, active: !prev.active }));
  };

  return (
    <AuthContext.Provider value={{
      user, login, register, logout, isLoading, error,
      demoMode, setDemoScenario, toggleDemoMode, isBackendAvailable,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
