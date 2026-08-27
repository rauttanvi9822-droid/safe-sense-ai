import type { RiskCategory } from '../types';
import clsx from 'clsx';

interface SVIMeterProps {
  score: number;
  risk: RiskCategory;
  size?: 'sm' | 'md' | 'lg';
}

const RISK_COLORS: Record<RiskCategory, { bar: string; text: string; bg: string }> = {
  LOW: { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
  MODERATE: { bar: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' },
  HIGH: { bar: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
  CRITICAL: { bar: 'bg-red-600', text: 'text-red-700', bg: 'bg-red-50' },
};

export function SVIMeter({ score, risk, size = 'md' }: SVIMeterProps) {
  const colors = RISK_COLORS[risk];
  const pct = Math.min(100, Math.max(0, score));

  if (size === 'sm') {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className={clsx('font-semibold', colors.text)}>SVI {score}</span>
          <span className={clsx('font-medium', colors.text)}>{risk}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div
            className={clsx('h-1.5 rounded-full transition-all duration-700', colors.bar)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={clsx('rounded-xl p-6', colors.bg)}>
        <div className="text-center mb-4">
          <div className={clsx('text-5xl font-bold', colors.text)}>{score}</div>
          <div className="text-slate-500 text-sm mt-1">out of 100</div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
          <div className="relative w-full bg-slate-200 rounded-full h-3">
            <div
              className={clsx('h-3 rounded-full transition-all duration-1000', colors.bar)}
              style={{ width: `${pct}%` }}
            />
            {/* Band markers */}
            {[25, 50, 75].map((v) => (
              <div
                key={v}
                className="absolute top-0 w-0.5 h-3 bg-white"
                style={{ left: `${v}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-green-600">LOW</span>
            <span className="text-yellow-600">MODERATE</span>
            <span className="text-orange-600">HIGH</span>
            <span className="text-red-600">CRITICAL</span>
          </div>
        </div>
        <div className={clsx('text-center text-xl font-bold mt-4', colors.text)}>
          Risk: {risk}
        </div>
        <p className="text-center text-xs text-slate-500 mt-2">
          Prototype decision-support thresholds — not clinically validated.
        </p>
      </div>
    );
  }

  return (
    <div className={clsx('rounded-lg p-4', colors.bg)}>
      <div className="flex justify-between items-center mb-2">
        <span className={clsx('text-2xl font-bold', colors.text)}>{score}/100</span>
        <span className={clsx('font-semibold text-sm px-3 py-1 rounded-full border', colors.text, 'border-current bg-white/50')}>
          {risk}
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className={clsx('h-2 rounded-full transition-all duration-700', colors.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Prototype thresholds — not clinically validated.
      </p>
    </div>
  );
}
