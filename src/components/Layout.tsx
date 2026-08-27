import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui';
import clsx from 'clsx';

export function Navbar() {
  const { user, logout, demoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {demoMode.active && (
        <div className="bg-amber-400 text-amber-900 text-xs font-semibold text-center py-1.5 px-4">
          ⚠ DEMO MODE — Uses synthetic test data. Not for real case use.&nbsp;
          <span className="bg-amber-600 text-white rounded px-1.5 py-0.5">{demoMode.scenario}</span>
        </div>
      )}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex-shrink-0">
            <Logo size="sm" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/resources" label="Resources" current={location.pathname} />
            {user && <NavLink to={dashboardLink} label="Dashboard" current={location.pathname} />}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User size={15} />
                  <span className="font-medium">{user.name}</span>
                  <Badge variant="info">{user.role}</Badge>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0f2547] transition-colors"
                >
                  <LogOut size={15} />
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
                  className="bg-[#0f2547] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1a3a6b] transition-colors"
                >
                  Start Assessment
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
          <div className="md:hidden border-t border-slate-100 py-3 space-y-2">
            <MobileLink to="/resources" label="Resources" onClick={() => setMobileOpen(false)} />
            {user && (
              <MobileLink
                to={dashboardLink}
                label="Dashboard"
                onClick={() => setMobileOpen(false)}
              />
            )}
            {user ? (
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                Sign out
              </button>
            ) : (
              <>
                <MobileLink to="/login" label="Sign in" onClick={() => setMobileOpen(false)} />
                <MobileLink to="/assessment" label="Start Assessment" onClick={() => setMobileOpen(false)} />
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
          <h1 className="text-xl font-bold text-[#0f2547]">{title}</h1>
          {badge && (
            <span className="bg-cyan-100 text-cyan-700 text-xs font-medium px-2 py-0.5 rounded-full">
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
