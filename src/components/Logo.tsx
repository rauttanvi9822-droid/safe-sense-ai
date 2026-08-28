import { Shield } from 'lucide-react';
import clsx from 'clsx';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}

export function Logo({ size = 'md', variant = 'dark' }: LogoProps) {
  const sizes = {
    sm: { icon: 18, text: 'text-base', sub: 'text-xs' },
    md: { icon: 24, text: 'text-xl', sub: 'text-xs' },
    lg: { icon: 32, text: 'text-2xl', sub: 'text-sm' },
  };
  const s = sizes[size];
  const textColor = variant === 'light' ? 'text-white' : 'text-[#123b68]';
  const mutedColor = variant === 'light' ? 'text-cyan-200' : 'text-[#1689b0]';

  return (
    <div className="flex items-center gap-2">
      <div
        className={clsx(
          'flex items-center justify-center rounded-lg',
          variant === 'light' ? 'bg-white/20' : 'bg-[#145da0]',
          size === 'sm' ? 'w-7 h-7' : size === 'md' ? 'w-9 h-9' : 'w-12 h-12'
        )}
      >
        <Shield
          size={s.icon}
          className={variant === 'light' ? 'text-cyan-200' : 'text-cyan-400'}
          strokeWidth={1.8}
        />
      </div>
      <div>
        <div className={clsx('font-bold tracking-tight leading-none', s.text, textColor)}>
          SAFE-SENSE AI
        </div>
        <div className={clsx('leading-tight mt-0.5', s.sub, mutedColor)}>
          AI-assisted assessment. Human-centered support.
        </div>
      </div>
    </div>
  );
}
