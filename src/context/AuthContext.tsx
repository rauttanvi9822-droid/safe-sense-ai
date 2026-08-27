import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, DemoModeState, DemoScenario } from '../types';
import { getStoredUser, storeUser, clearUser, mockLogin } from '../lib/mockAuth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  demoMode: DemoModeState;
  setDemoScenario: (scenario: DemoScenario) => void;
  toggleDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demoMode, setDemoMode] = useState<DemoModeState>({
    active: false,
    scenario: 'MODERATE',
  });

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const u = mockLogin(email, password);
    if (!u) return false;
    storeUser(u);
    setUser(u);
    return true;
  };

  const logout = () => {
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
    <AuthContext.Provider value={{ user, login, logout, isLoading, demoMode, setDemoScenario, toggleDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
