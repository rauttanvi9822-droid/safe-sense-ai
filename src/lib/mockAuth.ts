import type { User, UserRole } from '../types';

// ─── Demo credentials ─────────────────────────────────────────────────────────
// NOTE: These are prototype demo credentials only. In production,
// use Supabase Auth with proper password hashing and session management.

export const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'victim@demo.safesense': {
    password: 'demo1234',
    user: {
      id: 'u-victim-001',
      email: 'victim@demo.safesense',
      name: 'Demo User',
      role: 'victim' as UserRole,
      language: 'en',
      createdAt: '2025-01-01T00:00:00Z',
    },
  },
  'counsellor@demo.safesense': {
    password: 'demo1234',
    user: {
      id: 'u-counsellor-001',
      email: 'counsellor@demo.safesense',
      name: 'Dr. Priya Sharma',
      role: 'counsellor' as UserRole,
      language: 'en',
      createdAt: '2025-01-01T00:00:00Z',
    },
  },
  'admin@demo.safesense': {
    password: 'demo1234',
    user: {
      id: 'u-admin-001',
      email: 'admin@demo.safesense',
      name: 'System Admin',
      role: 'admin' as UserRole,
      language: 'en',
      createdAt: '2025-01-01T00:00:00Z',
    },
  },
};

export function mockLogin(email: string, password: string): User | null {
  const entry = DEMO_USERS[email.toLowerCase()];
  if (!entry) return null;
  if (entry.password !== password) return null;
  return entry.user;
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('safesense_user');
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function storeUser(user: User): void {
  localStorage.setItem('safesense_user', JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem('safesense_user');
}
