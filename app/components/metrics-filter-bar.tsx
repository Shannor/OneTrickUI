import type { GameMode } from '~/api';
import {
  GAME_MODE_OPTIONS,
  GameModeSelector,
} from '~/components/game-mode-selector';
import { DateRangePicker } from '~/components/ui/date-range-picker';
import type { CustomTimeWindow, TimeWindow } from '~/lib/metrics';
import { cn } from '~/lib/utils';

export { GAME_MODE_OPTIONS };

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

      <GameModeSelector
        value={gameMode}
        onValueChange={onGameModeChange}
      />
    </div>
  );
}
