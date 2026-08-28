import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-[#145da0] text-white hover:bg-[#104d87] focus:ring-[#145da0] active:bg-[#0d416f] shadow-sm shadow-blue-900/10',
    secondary:
      'bg-[#1689b0] text-white hover:bg-[#117595] focus:ring-[#1689b0] active:bg-[#0d647f]',
    outline:
      'border border-[#9fc3dc] text-[#145da0] bg-white hover:bg-[#f0f7fb] focus:ring-[#145da0]',
    ghost:
      'text-[#0f2547] bg-transparent hover:bg-slate-100 focus:ring-[#0f2547]',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-slate-200 shadow-[0_8px_24px_rgba(24,76,116,0.06)]',
        hover && 'hover:shadow-[0_12px_30px_rgba(24,76,116,0.11)] hover:border-blue-200 transition-shadow duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'low' | 'moderate' | 'high' | 'critical' | 'neutral' | 'info';
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const variants = {
    low: 'bg-green-100 text-green-800 border-green-200',
    moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant]
      )}
    >
      {children}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, BadgeProps['variant']> = {
    LOW: 'low',
    MODERATE: 'moderate',
    HIGH: 'high',
    CRITICAL: 'critical',
  };
  return <Badge variant={map[risk] ?? 'neutral'}>{risk}</Badge>;
}

interface AlertProps {
  type: 'info' | 'warning' | 'success' | 'error' | 'disclaimer';
  children: React.ReactNode;
  className?: string;
}

export function Alert({ type, children, className }: AlertProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    disclaimer: 'bg-slate-50 border-slate-300 text-slate-700',
  };
  return (
    <div className={clsx('rounded-lg border px-4 py-3 text-sm', styles[type], className)}>
      {children}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      <input
        className={clsx(
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-[#0f2547] focus:border-transparent',
          'disabled:bg-slate-50 disabled:text-slate-500',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TextArea({ label, className, ...props }: TextAreaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      <textarea
        className={clsx(
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-[#0f2547] focus:border-transparent',
          className
        )}
        {...props}
      />
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      <select
        className={clsx(
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900',
          'focus:outline-none focus:ring-2 focus:ring-[#0f2547] focus:border-transparent',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }[size];
  return (
    <svg className={clsx('animate-spin', s)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, subtitle, children, className }: SectionProps) {
  return (
    <section className={clsx('space-y-4', className)}>
      <div>
        <h2 className="text-lg font-semibold text-[#0f2547]">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={clsx('border-slate-200', className)} />;
}

export function PrototypeDisclaimer() {
  return (
    <Alert type="disclaimer" className="text-xs">
      <strong>Prototype Notice:</strong> This is a demonstration system. Assessment indicators and
      SVI thresholds are not clinically validated. This application does not provide a medical or
      psychiatric diagnosis.
    </Alert>
  );
}
