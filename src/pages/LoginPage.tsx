import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogIn, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button, Input, Alert, Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'counsellor') navigate('/counsellor');
      else navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (!ok) {
      setError('Invalid email or password. Please check the demo credentials below.');
      return;
    }
    // Navigation handled by effect above
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2547] via-[#1a3a6b] to-[#0891b2] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <Shield size={32} className="text-cyan-300" />
          </div>
          <Logo size="md" variant="light" />
        </div>

        <Card className="p-8">
          <h1 className="text-xl font-bold text-[#0f2547] mb-1">Professional Sign In</h1>
          <p className="text-sm text-slate-500 mb-6">
            Sign in to access your counsellor or admin dashboard.
          </p>

          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.gov.in"
              required
              autoComplete="username"
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2547] focus:border-transparent"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg">
              <LogIn size={16} />
              Sign In
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-800 mb-2">🔑 Demo Credentials (Prototype)</p>
            <div className="space-y-2 text-xs text-amber-700 font-mono">
              {[
                { role: 'Victim/User', email: 'victim@demo.safesense', pw: 'demo1234' },
                { role: 'Counsellor', email: 'counsellor@demo.safesense', pw: 'demo1234' },
                { role: 'Admin', email: 'admin@demo.safesense', pw: 'demo1234' },
              ].map((c) => (
                <div
                  key={c.email}
                  className="flex flex-col cursor-pointer hover:text-amber-900"
                  onClick={() => { setEmail(c.email); setPassword(c.pw); }}
                >
                  <span className="font-semibold text-amber-800">{c.role}</span>
                  <span>{c.email} / {c.pw}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-2">Click a credential to auto-fill.</p>
          </div>
        </Card>

        <p className="text-center text-xs text-blue-200">
          SAFE-SENSE AI — Prototype system. Not for real-world use.
        </p>
      </div>
    </div>
  );
}
