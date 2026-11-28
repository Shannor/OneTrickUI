import { cn } from '~/lib/utils';

export type WinLossRecordFormat =
  'compact' | 'spaced-parens' | 'en-dash' | 'numeric-parens';

export function getWinLossColorClass(wins: number, losses: number): string {
  if (wins === 0 && losses === 0) {
    return 'text-muted-foreground';
  }
  return wins >= losses
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';
}

export function formatWinLossRecord(
  wins: number,
  losses: number,
  format: WinLossRecordFormat = 'compact',
): string {
  switch (format) {
    case 'spaced-parens':
      return `(${wins}W - ${losses}L)`;
    case 'en-dash':
      return `${wins}W–${losses}L`;
    case 'numeric-parens':
      return `(${wins}-${losses})`;
    case 'compact':
    default:
      return `${wins}W-${losses}L`;
  }
}

export interface WinLossRecordProps {
  wins: number;
  losses: number;
  format?: WinLossRecordFormat;
  className?: string;
}

export function WinLossRecord({
  wins,
  losses,
  format = 'compact',
  className,
}: WinLossRecordProps) {
  return (
    <span
      className={cn(
        'font-medium tabular-nums',
        getWinLossColorClass(wins, losses),
        className,
      )}
    >
      {formatWinLossRecord(wins, losses, format)}
    </span>
  );
}
