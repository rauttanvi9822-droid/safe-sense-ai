/**
 * SafeSense AI — Login + Registration Page
 * Includes Google Sign-In placeholder (ready for OAuth configuration)
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, UserPlus } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button, Input, Alert, Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { Language, OnboardingState } from '../types';

type Mode = 'login' | 'register';

// Google SVG icon
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const { login, register, user, error: authError, isBackendAvailable } = useAuth();
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      const returnPath = sessionStorage.getItem('assessment_return_path');
      if (returnPath) {
        try {
          const onboarding = JSON.parse(sessionStorage.getItem('assessment_onboarding') ?? '') as OnboardingState;
          if (onboarding.language) setLanguage(onboarding.language as Language);
        } catch { /* no pending onboarding preference */ }
        sessionStorage.removeItem('assessment_return_path');
        navigate(returnPath);
        return;
      }
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'counsellor') navigate('/counsellor');
      else navigate('/assessment');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    if (mode === 'register') {
      if (password.length < 8) { setLocalError('Password must be at least 8 characters.'); setLoading(false); return; }
      if (password !== confirmPassword) { setLocalError('Passwords do not match.'); setLoading(false); return; }
      if (!name.trim()) { setLocalError('Name is required.'); setLoading(false); return; }
      const ok = await register(email, password, name.trim());
      setLoading(false);
      if (!ok) setLocalError(authError ?? 'Registration failed. Please try again.');
      return;
    }

    const ok = await login(email, password);
    setLoading(false);
    if (!ok) setLocalError(authError ?? 'Invalid email or password.');
  };

  const handleGoogleSignIn = () => {
    // Google OAuth placeholder — configure VITE_GOOGLE_CLIENT_ID to enable
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
      setLocalError('Google Sign-In is not configured yet. Please use email sign-in or demo credentials below.');
      return;
    }
    // When configured: redirect to Google OAuth consent screen
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    window.location.href =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2547] via-[#1a3a6b] to-[#0891b2] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <Logo size="md" variant="light" />
          <p className="text-blue-200 text-sm mt-2">Your private wellbeing companion</p>
        </div>

        <Card className="p-7">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-slate-200 p-1 mb-6">
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setLocalError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize ${mode === m ? 'bg-[#0f2547] text-white' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <h1 className="text-lg font-bold text-[#0f2547] mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-slate-500 mb-5">
            {mode === 'login'
              ? 'Sign in to access your dashboard and conversations.'
              : 'Your data stays private and is tied only to your account.'}
          </p>

          {displayError && <Alert type="error" className="mb-4">{displayError}</Alert>}

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 border border-slate-300 rounded-lg py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors mb-4"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="relative flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or with email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {mode === 'register' && !isBackendAvailable && (
            <Alert type="warning" className="mb-4 text-xs">
              Registration requires the backend server. To use demo mode, use the demo credentials below.
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Full name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
              />
            )}
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="username"
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2547] focus:border-transparent"
                  required
                  minLength={mode === 'register' ? 8 : undefined}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'register' && <p className="text-xs text-slate-400">Minimum 8 characters</p>}
            </div>
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Confirm password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2547] focus:border-transparent"
                  required
                  autoComplete="new-password"
                />
              </div>
            )}
            <Button type="submit" fullWidth loading={loading} size="lg">
              {mode === 'login' ? <><LogIn size={16} /> Sign In</> : <><UserPlus size={16} /> Create Account</>}
            </Button>
          </form>

          {/* Demo credentials */}
          {mode === 'login' && (
            <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-800 mb-2">🔑 Demo — works without backend</p>
              <div className="space-y-1.5 text-xs text-amber-700 font-mono">
                {[
                  { role: 'User', email: 'victim@demo.safesense', pw: 'demo1234' },
                  { role: 'Counsellor', email: 'counsellor@demo.safesense', pw: 'demo1234' },
                ].map(c => (
                  <div key={c.email} className="flex flex-col cursor-pointer hover:text-amber-900 hover:bg-amber-100 rounded px-2 py-1 transition-colors"
                    onClick={() => { setEmail(c.email); setPassword(c.pw); }}>
                    <span className="font-semibold text-amber-800">{c.role}</span>
                    <span>{c.email} / {c.pw}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-600 mt-1.5">Click to auto-fill.</p>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-blue-200">
          Your data is private and tied only to your account.
        </p>
      </div>
    </div>
  );
}
