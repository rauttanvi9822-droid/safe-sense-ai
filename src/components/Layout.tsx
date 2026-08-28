import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Menu, X, Globe } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../types';
import clsx from 'clsx';

const LANG_LABELS: Record<Language, string> = { en: 'EN', hi: 'हि', mr: 'म' };
const LANG_FULL: Record<Language, string> = { en: 'English', hi: 'हिन्दी', mr: 'मराठी' };

export function Navbar() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [langOpen, setLangOpen] = React.useState(false);
  const langRef = React.useRef<HTMLDivElement>(null);

  // Close language picker when clicking outside
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardLink =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'counsellor'
        ? '/counsellor'
        : '/dashboard';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-[0_2px_14px_rgba(24,76,116,0.06)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex-shrink-0">
            <Logo size="sm" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/chat" label="Chat" current={location.pathname} />
            {user && <NavLink to={dashboardLink} label="Dashboard" current={location.pathname} />}
            {user && user.role === 'victim' && <NavLink to="/profile" label="Profile" current={location.pathname} />}
            {user && user.role === 'victim' && (
              <>
                <NavLink to="/checkin" label="Check-In" current={location.pathname} />
                <NavLink to="/progress" label="Progress" current={location.pathname} />
              </>
            )}
            <NavLink to="/privacy" label="Privacy" current={location.pathname} />
          </div>

          <div className="hidden md:flex items-center gap-2">
            {/* Language picker */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(v => !v)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-[#0f2547] transition-colors"
                title="Language / भाषा / भाषा"
              >
                <Globe size={13} />
                {LANG_LABELS[language]}
              </button>
              {langOpen && (
                <div className="absolute right-0 top-9 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 min-w-[130px]">
                  {(['en', 'hi', 'mr'] as Language[]).map(l => (
                    <button
                      key={l}
                      onClick={() => { setLanguage(l); setLangOpen(false); }}
                      className={clsx(
                        'w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors',
                        l === language ? 'text-[#0f2547] font-semibold' : 'text-slate-600'
                      )}
                    >
                      {LANG_FULL[l]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <div className="w-7 h-7 bg-[#0f2547] rounded-full flex items-center justify-center">
                    <User size={13} className="text-cyan-300" />
                  </div>
                  <span className="font-medium text-sm">{user.name.split(' ')[0]}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-[#0f2547] hover:text-cyan-600 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/assessment"
                  className="bg-[#145da0] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#104d87] transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            <MobileLink to="/chat" label="Chat" onClick={() => setMobileOpen(false)} />
            {user && (
              <MobileLink to={dashboardLink} label="Dashboard" onClick={() => setMobileOpen(false)} />
            )}
            {user && user.role === 'victim' && (
              <MobileLink to="/profile" label="Profile" onClick={() => setMobileOpen(false)} />
            )}
            {user && user.role === 'victim' && (
              <>
                <MobileLink to="/checkin" label="Daily Check-In" onClick={() => setMobileOpen(false)} />
                <MobileLink to="/progress" label="Progress" onClick={() => setMobileOpen(false)} />
                <MobileLink to="/support" label="Get Support" onClick={() => setMobileOpen(false)} />
              </>
            )}
            <MobileLink to="/privacy" label="Privacy & Security" onClick={() => setMobileOpen(false)} />

            {/* Mobile language */}
            <div className="px-3 py-2">
              <p className="text-xs text-slate-400 mb-1">Language</p>
              <div className="flex gap-2">
                {(['en', 'hi', 'mr'] as Language[]).map(l => (
                  <button
                    key={l}
                    onClick={() => { setLanguage(l); setMobileOpen(false); }}
                    className={clsx(
                      'px-3 py-1 rounded-lg text-sm border transition-colors',
                      l === language ? 'bg-[#0f2547] text-white border-[#0f2547]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {LANG_FULL[l]}
                  </button>
                ))}
              </div>
            </div>

            {user ? (
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <LogOut size={14} /> Sign out
              </button>
            ) : (
              <>
                <MobileLink to="/login" label="Sign in" onClick={() => setMobileOpen(false)} />
                <MobileLink to="/assessment" label="Get Started" onClick={() => setMobileOpen(false)} />
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

function NavLink({ to, label, current }: { to: string; label: string; current: string }) {
  const active = current === to || current.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={clsx(
        'text-sm font-medium transition-colors',
        active ? 'text-[#0f2547]' : 'text-slate-500 hover:text-[#0f2547]'
      )}
    >
      {label}
    </Link>
  );
}

function MobileLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg"
    >
      {label}
    </Link>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
  back?: string;
}

export function PageHeader({ title, subtitle, badge, actions, back }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        {back && (
          <button
            onClick={() => navigate(back)}
            className="text-sm text-slate-500 hover:text-[#0f2547] mb-1 flex items-center gap-1"
          >
            ← Back
          </button>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#123b68] tracking-tight">{title}</h1>
          {badge && (
            <span className="bg-[#e7f4fb] text-[#14648e] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#c9e5f3]">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

export function StatCard({ label, value, icon, color = 'bg-blue-50 text-blue-600' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-[#0f2547]">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}
