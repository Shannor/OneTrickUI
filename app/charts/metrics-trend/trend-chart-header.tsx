import { cn } from '~/lib/utils';

import type { MatchWindowPreset, TrendMetricKey } from './metrics-trend-config';
import { TrendLegend } from './trend-legend';
import { WindowPresetPills } from './window-preset-pills';

const COMPACT_METRIC_OPTIONS: ReadonlyArray<{
  key: TrendMetricKey;
  label: string;
}> = [
  { key: 'kd', label: 'K/D' },
  { key: 'kda', label: 'Eff' },
  { key: 'winPct', label: 'Win %' },
  { key: 'combat', label: 'K/D/A' },
];

export interface CompactMetricPickerProps {
  activeMetric: TrendMetricKey;
  onSelectMetric: (metric: TrendMetricKey) => void;
}

export function CompactMetricPicker({
  activeMetric,
  onSelectMetric,
}: CompactMetricPickerProps) {
  return (
    <div
      role="group"
      aria-label="Compact metric selector"
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/40 p-0.5"
    >
      {COMPACT_METRIC_OPTIONS.map(({ key, label }) => {
        const active = activeMetric === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onSelectMetric(key)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              active
                ? 'bg-secondary font-semibold text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export interface TrendChartHeaderProps {
  title: string;
  subtitle: string;
  activeMetric: TrendMetricKey;
  totalMatches: number;
  isHighVolume: boolean;
  allowSummaryPreset?: boolean;
  windowPreset: MatchWindowPreset;
  onSelectPreset: (preset: MatchWindowPreset) => void;
  compactMetricPicker?: CompactMetricPickerProps;
}

export function TrendChartHeader({
  title,
  subtitle,
  activeMetric,
  totalMatches,
  isHighVolume,
  allowSummaryPreset = true,
  windowPreset,
  onSelectPreset,
  compactMetricPicker,
}: TrendChartHeaderProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="font-heading text-lg font-semibold tracking-wide text-foreground sm:text-xl">
            {title}
          </h4>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {compactMetricPicker && (
            <CompactMetricPicker
              activeMetric={compactMetricPicker.activeMetric}
              onSelectMetric={compactMetricPicker.onSelectMetric}
            />
          )}

          <WindowPresetPills
            totalMatches={totalMatches}
            isHighVolume={isHighVolume}
            allowSummaryPreset={allowSummaryPreset}
            windowPreset={windowPreset}
            onSelectPreset={onSelectPreset}
          />
        </div>
      </div>

      <TrendLegend activeMetric={activeMetric} />
    </div>
  );
}
