import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

export function getDeltaColorClass(delta: number): string {
  if (delta > 0) {
    return 'text-emerald-600 dark:text-emerald-400';
  }
  if (delta < 0) {
    return 'text-amber-600 dark:text-amber-400';
  }
  return 'text-muted-foreground';
}

export interface DeltaBadgeProps {
  delta: number;
  label: string;
  showIcon?: boolean;
  className?: string;
  iconClassName?: string;
}

export function DeltaBadge({
  delta,
  label,
  showIcon = true,
  className,
  iconClassName,
}: DeltaBadgeProps) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 font-semibold',
        getDeltaColorClass(delta),
        className,
      )}
    >
      {showIcon && isPositive && (
        <TrendingUpIcon className={cn('h-3.5 w-3.5 shrink-0', iconClassName)} />
      )}
      {showIcon && isNegative && (
        <TrendingDownIcon
          className={cn('h-3.5 w-3.5 shrink-0', iconClassName)}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
