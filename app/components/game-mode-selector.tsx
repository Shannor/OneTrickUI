import type { GameMode } from '~/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { cn } from '~/lib/utils';

export const GAME_MODE_OPTIONS: ReadonlyArray<{
  value: GameMode;
  label: string;
  mobileLabel: string;
}> = [
  { value: 'allGameModes', label: 'All', mobileLabel: 'All Modes' },
  { value: 'quickplay', label: 'Quickplay', mobileLabel: 'Quickplay' },
  { value: 'competitive', label: 'Competitive', mobileLabel: 'Competitive' },
  { value: 'trials', label: 'Trials', mobileLabel: 'Trials' },
  { value: 'ironBanner', label: 'Iron Banner', mobileLabel: 'Iron Banner' },
];

export interface GameModeSelectorProps {
  value: GameMode;
  onValueChange: (value: GameMode) => void;
  className?: string;
  mobileSelectClassName?: string;
}

export function GameModeSelector({
  value,
  onValueChange,
  className,
  mobileSelectClassName,
}: GameModeSelectorProps) {
  return (
    <>
      <div className={cn('w-40 md:hidden', mobileSelectClassName)}>
        <Select
          value={value}
          onValueChange={(val) => onValueChange(val as GameMode)}
        >
          <SelectTrigger
            aria-label="Game Mode"
            className="h-11 touch-manipulation text-sm"
          >
            <SelectValue placeholder="All Modes" />
          </SelectTrigger>
          <SelectContent>
            {GAME_MODE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.mobileLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        role="group"
        aria-label="Filter by game mode"
        className={cn(
          'hidden w-fit items-center gap-1 rounded-lg border border-border bg-secondary/40 p-1 md:inline-flex',
          className,
        )}
      >
        {GAME_MODE_OPTIONS.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onValueChange(opt.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
