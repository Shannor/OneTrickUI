import type { MapSignal } from '~/lib/metrics';
import { cn } from '~/lib/utils';

const SIGNAL_STYLES: Record<MapSignal, { label: string; className: string }> = {
  strong: {
    label: 'Strong',
    className:
      'bg-emerald-500/15 font-semibold text-emerald-600 dark:text-emerald-400',
  },
  swap: {
    label: 'Swap',
    className: 'bg-red-500/15 font-semibold text-red-600 dark:text-red-400',
  },
  'low-sample': {
    label: '1g',
    className: 'bg-secondary font-medium text-muted-foreground',
  },
  neutral: {
    label: 'Neutral',
    className: 'bg-secondary font-medium text-muted-foreground',
  },
};

export interface MapSignalPillProps {
  signal: MapSignal;
}

export function MapSignalPill({ signal }: MapSignalPillProps) {
  const { label, className } = SIGNAL_STYLES[signal];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px]',
        className,
      )}
    >
      {label}
    </span>
  );
}

export interface KdBulletBarProps {
  kd: number;
  compact?: boolean;
}

export function KdBulletBar({ kd, compact = false }: KdBulletBarProps) {
  const fillPct = Math.min(100, (kd / 3.0) * 100);
  const isPositive = kd >= 1.0;

  return (
    <div
      className={cn(
        'relative rounded-full bg-secondary',
        compact ? 'h-1.5 w-20' : 'h-2 w-28',
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -bottom-0.5 -top-0.5 left-1/3 w-[1.5px] bg-muted-foreground/70"
      />
      <div
        className={cn(
          'h-full rounded-full',
          isPositive ? 'bg-emerald-500' : 'bg-red-500',
        )}
        style={{ width: `${fillPct}%` }}
      />
    </div>
  );
}

export interface WinRateBarProps {
  winPct: number;
}

export function WinRateBar({ winPct }: WinRateBarProps) {
  const clampedPct = Math.max(0, Math.min(100, winPct));

  return (
    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-red-600/85">
      <div
        className="h-full bg-emerald-500"
        style={{ width: `${clampedPct}%` }}
      />
    </div>
  );
}
