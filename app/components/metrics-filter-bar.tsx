import type { GameMode } from '~/api';
import { DateRangePicker } from '~/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import type { CustomTimeWindow, TimeWindow } from '~/lib/metrics';
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

export interface MetricsFilterBarProps {
  time: TimeWindow | CustomTimeWindow;
  onTimeChange: (value: TimeWindow | CustomTimeWindow) => void;
  gameMode: GameMode;
  onGameModeChange: (value: GameMode) => void;
  className?: string;
}

export function MetricsFilterBar({
  time,
  onTimeChange,
  gameMode,
  onGameModeChange,
  className,
}: MetricsFilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-row flex-wrap items-center justify-between gap-3',
        className,
      )}
    >
      <DateRangePicker value={time} onValueChange={onTimeChange} />

      <div className="w-[150px] md:hidden">
        <Select
          value={gameMode}
          onValueChange={(val) => onGameModeChange(val as GameMode)}
        >
          <SelectTrigger aria-label="Game Mode" className="h-9 text-xs">
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
        className="hidden items-center gap-1 rounded-lg border border-border bg-secondary/40 p-1 md:inline-flex"
      >
        {GAME_MODE_OPTIONS.map((opt) => {
          const isActive = gameMode === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onGameModeChange(opt.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
