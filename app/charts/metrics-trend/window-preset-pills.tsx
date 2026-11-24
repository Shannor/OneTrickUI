import { cn } from '~/lib/utils';

import {
  MEDIUM_MATCH_WINDOW,
  type MatchWindowPreset,
  SHORT_MATCH_WINDOW,
} from './metrics-trend-config';

export interface WindowPresetPillsProps {
  totalMatches: number;
  isHighVolume: boolean;
  allowSummaryPreset?: boolean;
  windowPreset: MatchWindowPreset;
  onSelectPreset: (preset: MatchWindowPreset) => void;
}

export function WindowPresetPills({
  totalMatches,
  isHighVolume,
  allowSummaryPreset = true,
  windowPreset,
  onSelectPreset,
}: WindowPresetPillsProps) {
  const presets: Array<{
    value: MatchWindowPreset;
    label: string;
    min: number;
  }> = isHighVolume
    ? [
        ...(allowSummaryPreset
          ? [{ value: 'summary' as const, label: 'Summary Only', min: 0 }]
          : []),
        {
          value: '10',
          label: `Last ${SHORT_MATCH_WINDOW}g`,
          min: SHORT_MATCH_WINDOW + 1,
        },
        {
          value: '25',
          label: `Last ${MEDIUM_MATCH_WINDOW}g`,
          min: MEDIUM_MATCH_WINDOW + 1,
        },
      ]
    : [
        {
          value: '10',
          label: `Last ${SHORT_MATCH_WINDOW}g`,
          min: SHORT_MATCH_WINDOW + 1,
        },
        {
          value: '25',
          label: `Last ${MEDIUM_MATCH_WINDOW}g`,
          min: MEDIUM_MATCH_WINDOW + 1,
        },
        { value: 'all', label: 'All Matches', min: 0 },
      ];

  const visiblePresets = presets.filter((preset) => totalMatches >= preset.min);
  if (visiblePresets.length <= 1) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label="Match window range"
      className="inline-flex items-center gap-1 md:rounded-lg md:border md:border-border md:bg-secondary/40 md:p-0.5"
    >
      {visiblePresets.map((preset) => {
        const active = windowPreset === preset.value;
        return (
          <button
            key={preset.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelectPreset(preset.value)}
            className={cn(
              'rounded-md px-2 py-1 text-xs font-medium transition-colors',
              active
                ? 'font-semibold text-primary md:bg-secondary md:text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}

export interface HighVolumeSummaryBarProps {
  totalMatches: number;
  windowPreset: MatchWindowPreset;
  onSelectPreset: (preset: MatchWindowPreset) => void;
}

export function HighVolumeSummaryBar({
  totalMatches,
  windowPreset,
  onSelectPreset,
}: HighVolumeSummaryBarProps) {
  return (
    <div className="flex flex-col justify-between gap-2 border-b border-border pb-3 text-xs text-muted-foreground sm:flex-row sm:items-center md:border-b-0 md:border-t md:bg-secondary/20 md:px-5 md:py-2.5">
      <span>
        Showing summary numbers across{' '}
        <span className="font-semibold text-foreground">{totalMatches}</span>{' '}
        matches. Narrow the date range or inspect a recent match window to plot
        trends.
      </span>
      <WindowPresetPills
        totalMatches={totalMatches}
        isHighVolume
        windowPreset={windowPreset}
        onSelectPreset={onSelectPreset}
      />
    </div>
  );
}
