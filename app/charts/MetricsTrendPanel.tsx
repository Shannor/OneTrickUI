import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '~/components/ui/chart';
import {
  type MatchPoint,
  type TelemetrySummary,
  summarizeMatchSamples,
} from '~/lib/metrics';
import { cn } from '~/lib/utils';

export const HIGH_VOLUME_MATCH_THRESHOLD = 50;

export type TrendMetricKey = 'kd' | 'kda' | 'winPct' | 'combat';
export type MatchWindowPreset = 'summary' | '10' | '25' | 'all';

const chartConfig = {
  rollingKd: {
    label: '5-Game Avg K/D',
    color: 'var(--chart-primary)',
  },
  kd: {
    label: 'Match K/D',
    color: 'var(--chart-primary)',
  },
  rollingKda: {
    label: '5-Game Avg Efficiency',
    color: 'var(--chart-secondary)',
  },
  kda: {
    label: 'Match Efficiency',
    color: 'var(--chart-secondary)',
  },
  rollingWinPct: {
    label: '5-Game Win %',
    color: 'var(--chart-primary)',
  },
  rollingKills: {
    label: '5-Game Avg Kills',
    color: 'var(--chart-primary)',
  },
  rollingAssists: {
    label: '5-Game Avg Assists',
    color: 'var(--chart-secondary)',
  },
  rollingDeaths: {
    label: '5-Game Avg Deaths',
    color: 'var(--chart-error)',
  },
} satisfies ChartConfig;

interface MiniSparklineProps {
  values: number[];
  stroke: string;
}

export function MiniSparkline({ values, stroke }: MiniSparklineProps) {
  if (values.length < 2 || values.length > HIGH_VOLUME_MATCH_THRESHOLD) {
    return null;
  }
  const width = 88;
  const height = 26;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const path = values
    .map((v, idx) => {
      const x = (idx / (values.length - 1)) * width;
      const y = height - 2 - ((v - min) / span) * (height - 4);
      return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="hidden shrink-0 lg:block"
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} />
    </svg>
  );
}

interface MatchOutcomeDotProps {
  cx?: number;
  cy?: number;
  payload?: MatchPoint;
  radius?: number;
}

function MatchOutcomeDot({
  cx,
  cy,
  payload,
  radius = 3.5,
}: MatchOutcomeDotProps) {
  if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) {
    return null;
  }
  const fill = payload.won ? '#22c55e' : '#ef4444';
  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={fill}
      stroke="hsl(var(--background))"
      strokeWidth={1.5}
    />
  );
}

interface TrendTooltipContentProps {
  active?: boolean;
  payload?: Array<{ payload?: MatchPoint }>;
  activeMetric: TrendMetricKey;
}

function TrendTooltipContent({
  active,
  payload,
  activeMetric,
}: TrendTooltipContentProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) {
    return null;
  }

  return (
    <div className="min-w-[215px] rounded-lg border border-border/70 bg-background/95 p-3 text-xs shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground">
            Match #{point.matchIndex} · {point.location}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {point.shortLabel.split('·')[1]?.trim() ?? point.shortLabel}
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
            point.won
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/15 text-red-600 dark:text-red-400',
          )}
        >
          {point.won ? 'Win' : 'Loss'}
        </span>
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {activeMetric === 'kd' && (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">This Match K/D</span>
              <span className="font-semibold tabular-nums text-foreground">
                {point.kd.toFixed(2)}{' '}
                <span className="font-normal text-muted-foreground">
                  ({point.kills}K / {point.deaths}D / {point.assists}A)
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Your 5-Game Avg</span>
              <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {point.rollingKd.toFixed(2)}
              </span>
            </div>
          </>
        )}

        {activeMetric === 'kda' && (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">
                This Match Efficiency
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {point.kda.toFixed(2)}{' '}
                <span className="font-normal text-muted-foreground">
                  ({point.kills}K / {point.deaths}D / {point.assists}A)
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Your 5-Game Avg</span>
              <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {point.rollingKda.toFixed(2)}
              </span>
            </div>
          </>
        )}

        {activeMetric === 'winPct' && (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">This Match K/D</span>
              <span className="font-semibold tabular-nums text-foreground">
                {point.kd.toFixed(2)} ({point.kills}K / {point.deaths}D)
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">5-Game Win Rate</span>
              <span
                className={cn(
                  'font-bold tabular-nums',
                  point.rollingWinPct >= 50
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400',
                )}
              >
                {point.rollingWinPct}%
              </span>
            </div>
          </>
        )}

        {activeMetric === 'combat' && (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">This Match</span>
              <span className="font-semibold tabular-nums text-foreground">
                {point.kills}K / {point.deaths}D / {point.assists}A
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">5-Game Avg</span>
              <span className="font-bold tabular-nums text-foreground">
                {point.rollingKills.toFixed(1)}K /{' '}
                {point.rollingDeaths.toFixed(1)}D /{' '}
                {point.rollingAssists.toFixed(1)}A
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function TrendLegend({ activeMetric }: { activeMetric: TrendMetricKey }) {
  if (activeMetric === 'kd') {
    return (
      <div
        aria-label="Chart legend"
        className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span>Match K/D (Win / Loss)</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-emerald-500" />
          <span>Your 5-Game Avg</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 border-t border-dashed border-stone-400" />
          <span>1.00 Even K/D</span>
        </span>
      </div>
    );
  }

  if (activeMetric === 'kda') {
    return (
      <div
        aria-label="Chart legend"
        className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span>Match Efficiency (Win / Loss)</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-amber-400" />
          <span>Your 5-Game Avg</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 border-t border-dashed border-stone-400" />
          <span>1.50 Target</span>
        </span>
      </div>
    );
  }

  if (activeMetric === 'winPct') {
    return (
      <div
        aria-label="Chart legend"
        className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span>Match Outcome (Win / Loss)</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-emerald-500" />
          <span>5-Game Win %</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 border-t border-dashed border-stone-400" />
          <span>50% Even Win Rate</span>
        </span>
      </div>
    );
  }

  return (
    <div
      aria-label="Chart legend"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="h-0.5 w-4 rounded bg-emerald-500" />
        <span>5-Game Avg Kills</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-0.5 w-4 rounded bg-amber-400" />
        <span>5-Game Avg Assists</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-4 border-t-2 border-dashed border-red-500" />
        <span>5-Game Avg Deaths</span>
      </span>
    </div>
  );
}

function formatSignedDelta(delta: number | null, suffix = ''): string | null {
  if (delta === null || Number.isNaN(delta) || delta === 0) {
    return null;
  }
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}${suffix}`;
}

interface KpiItemDescriptor {
  key: TrendMetricKey;
  label: string;
  mobileLabel: string;
  primaryValue: string;
  subText?: string | null;
  subPositive?: boolean;
  valueClassName: string;
  activeBorderClassName: string;
  sparkValues: number[];
  sparkColor: string;
}

function buildKpiItems(
  summary: TelemetrySummary,
  sparkSource: MatchPoint[],
): KpiItemDescriptor[] {
  const kdDeltaText = formatSignedDelta(summary.kdDelta);
  const kdaDeltaText = formatSignedDelta(summary.kdaDelta);
  const winDeltaText = formatSignedDelta(summary.winPctDelta, '%');
  const isPositiveWin = summary.winPct >= 50;

  return [
    {
      key: 'kd',
      label: 'K/D Ratio',
      mobileLabel: 'K/D',
      primaryValue: summary.kd.toFixed(2),
      subText: kdDeltaText,
      subPositive: (summary.kdDelta ?? 0) >= 0,
      valueClassName:
        summary.kd >= 1
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400',
      activeBorderClassName: 'border-b-emerald-500 md:bg-emerald-500/[0.04]',
      sparkValues: sparkSource.map((p) => p.rollingKd),
      sparkColor: '#22c55e',
    },
    {
      key: 'kda',
      label: 'Efficiency (KDA)',
      mobileLabel: 'Eff',
      primaryValue: summary.kda.toFixed(2),
      subText: kdaDeltaText,
      subPositive: (summary.kdaDelta ?? 0) >= 0,
      valueClassName: 'text-amber-600 dark:text-amber-400',
      activeBorderClassName: 'border-b-amber-400 md:bg-amber-400/[0.04]',
      sparkValues: sparkSource.map((p) => p.rollingKda),
      sparkColor: '#eab308',
    },
    {
      key: 'winPct',
      label: 'Win Percentage',
      mobileLabel: 'Win %',
      primaryValue: `${summary.winPct}%`,
      subText: `${summary.wins}W–${summary.losses}L${winDeltaText ? ` (${winDeltaText})` : ''}`,
      subPositive: isPositiveWin,
      valueClassName: isPositiveWin
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400',
      activeBorderClassName: isPositiveWin
        ? 'border-b-emerald-500 md:bg-emerald-500/[0.04]'
        : 'border-b-red-500 md:bg-red-500/[0.04]',
      sparkValues: sparkSource.map((p) => p.rollingWinPct),
      sparkColor: isPositiveWin ? '#22c55e' : '#ef4444',
    },
    {
      key: 'combat',
      label: 'Avg Combat / Game',
      mobileLabel: 'K / D / A',
      primaryValue: `${summary.avgKills.toFixed(1)} / ${summary.avgDeaths.toFixed(1)} / ${summary.avgAssists.toFixed(1)}`,
      subText: `${summary.games} ${summary.games === 1 ? 'Match' : 'Matches'}`,
      subPositive: true,
      valueClassName: 'text-foreground',
      activeBorderClassName: 'border-b-primary md:bg-primary/[0.04]',
      sparkValues: sparkSource.map((p) => p.rollingKills),
      sparkColor: '#f97316',
    },
  ];
}

function KpiStatCellContent({
  item,
  showSparkline,
}: {
  item: KpiItemDescriptor;
  showSparkline: boolean;
}) {
  return (
    <>
      <div className="min-w-0">
        <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">
          {item.mobileLabel}
        </div>
        <div className="hidden truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:block">
          {item.label}
        </div>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
          <span
            className={cn(
              'font-bold tabular-nums tracking-tight',
              item.key === 'combat'
                ? 'text-xs sm:text-base lg:text-xl'
                : 'text-base sm:text-xl lg:text-2xl',
              item.valueClassName,
            )}
          >
            {item.primaryValue}
          </span>
          {item.subText && (
            <span
              className={cn(
                'hidden text-xs font-medium tabular-nums md:inline',
                item.key === 'combat' || item.key === 'winPct'
                  ? 'text-muted-foreground'
                  : item.subPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400',
              )}
            >
              {item.subText}
            </span>
          )}
        </div>
      </div>
      {showSparkline && (
        <MiniSparkline values={item.sparkValues} stroke={item.sparkColor} />
      )}
    </>
  );
}

interface TrendKpiTabsProps {
  summary: TelemetrySummary;
  sparkPoints: MatchPoint[];
  activeMetric: TrendMetricKey;
  onSelectMetric: (metric: TrendMetricKey) => void;
  isSummaryOnly: boolean;
}

export function TrendKpiTabs({
  summary,
  sparkPoints,
  activeMetric,
  onSelectMetric,
  isSummaryOnly,
}: TrendKpiTabsProps) {
  const items = buildKpiItems(summary, sparkPoints);

  if (isSummaryOnly) {
    return (
      <div
        aria-label="Performance summary stats"
        className="grid grid-cols-2 gap-y-3 border-y border-border py-3 sm:grid-cols-4 sm:gap-y-0 md:divide-x md:divide-border md:border-y-0 md:py-0"
      >
        {items.map((item) => (
          <div
            key={item.key}
            className="flex min-w-0 items-center justify-between gap-2 px-2 sm:px-3 md:px-5 md:py-4"
          >
            <KpiStatCellContent item={item} showSparkline={false} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Performance metric selector"
      className="grid grid-cols-4 border-y border-border md:divide-x md:divide-border md:border-t-0"
    >
      {items.map((item) => {
        const isSelected = activeMetric === item.key;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectMetric(item.key)}
            className={cn(
              'flex min-w-0 items-center justify-between gap-2 border-b-2 px-1.5 py-2.5 text-left transition-colors sm:px-3 md:px-5 md:py-3.5',
              isSelected
                ? item.activeBorderClassName
                : 'border-b-transparent hover:bg-secondary/30',
            )}
          >
            <KpiStatCellContent item={item} showSparkline />
          </button>
        );
      })}
    </div>
  );
}

interface WindowPresetPillsProps {
  totalMatches: number;
  isHighVolume: boolean;
  allowSummaryPreset?: boolean;
  windowPreset: MatchWindowPreset;
  onSelectPreset: (preset: MatchWindowPreset) => void;
}

function WindowPresetPills({
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
        { value: '10', label: 'Last 10g', min: 11 },
        { value: '25', label: 'Last 25g', min: 26 },
      ]
    : [
        { value: '10', label: 'Last 10g', min: 11 },
        { value: '25', label: 'Last 25g', min: 26 },
        { value: 'all', label: 'All Matches', min: 0 },
      ];

  const visiblePresets = presets.filter((p) => totalMatches >= p.min);
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

interface HighVolumeSummaryBarProps {
  totalMatches: number;
  windowPreset: MatchWindowPreset;
  onSelectPreset: (preset: MatchWindowPreset) => void;
}

function HighVolumeSummaryBar({
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

interface TrendChartHeaderProps {
  title: string;
  subtitle: string;
  activeMetric: TrendMetricKey;
  totalMatches: number;
  isHighVolume: boolean;
  allowSummaryPreset?: boolean;
  windowPreset: MatchWindowPreset;
  onSelectPreset: (preset: MatchWindowPreset) => void;
  compactMetricPicker?: {
    activeMetric: TrendMetricKey;
    onSelectMetric: (metric: TrendMetricKey) => void;
  };
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
            <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/40 p-0.5">
              {(
                [
                  ['kd', 'K/D'],
                  ['kda', 'Eff'],
                  ['winPct', 'Win %'],
                  ['combat', 'K/D/A'],
                ] as const
              ).map(([key, label]) => {
                const active = compactMetricPicker.activeMetric === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => compactMetricPicker.onSelectMetric(key)}
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

const METRIC_METADATA: Record<
  TrendMetricKey,
  { title: string; subtitle: string }
> = {
  kd: {
    title: 'K/D Ratio by Match',
    subtitle:
      'Each dot is your K/D in a single match; the solid line tracks your 5-game rolling average.',
  },
  kda: {
    title: 'Efficiency (KDA) by Match',
    subtitle:
      'Each dot is your (Kills + Assists) / Deaths in a single match; the solid line tracks your 5-game average.',
  },
  winPct: {
    title: '5-Game Rolling Win Rate',
    subtitle:
      'Tracks your win percentage over your last 5 matches compared against a 50% even win rate.',
  },
  combat: {
    title: 'Kills, Assists & Deaths (5-Game Avg)',
    subtitle:
      'Tracks your average kills, assists, and deaths per match across a 5-game window.',
  },
};

function getDefaultWindowPreset(
  totalMatches: number,
  hideKpiTabs: boolean,
): MatchWindowPreset {
  if (totalMatches > HIGH_VOLUME_MATCH_THRESHOLD) {
    return hideKpiTabs ? '25' : 'summary';
  }
  return 'all';
}

export interface MetricsTrendPanelProps {
  points: MatchPoint[];
  summary: TelemetrySummary;
  hideKpiTabs?: boolean;
  titleOverride?: string;
  syncId?: string;
  className?: string;
}

export function MetricsTrendPanel({
  points,
  summary,
  hideKpiTabs = false,
  titleOverride,
  syncId,
  className,
}: MetricsTrendPanelProps) {
  const isHighVolume = points.length > HIGH_VOLUME_MATCH_THRESHOLD;
  const seriesSignature = useMemo(
    () => points.map((p) => `${p.activityId}:${p.time}`).join('|'),
    [points],
  );
  const [activeMetric, setActiveMetric] = useState<TrendMetricKey>('kd');
  const [windowPreset, setWindowPreset] = useState<MatchWindowPreset>(() =>
    getDefaultWindowPreset(points.length, hideKpiTabs),
  );
  const [brushRange, setBrushRange] = useState<{
    startIndex: number;
    endIndex: number;
  }>(() => ({
    startIndex: 0,
    endIndex: Math.max(0, points.length - 1),
  }));

  useEffect(() => {
    setWindowPreset(getDefaultWindowPreset(points.length, hideKpiTabs));
    setBrushRange({
      startIndex: 0,
      endIndex: Math.max(0, points.length - 1),
    });
  }, [seriesSignature, points.length, hideKpiTabs]);

  const visibleData = useMemo(() => {
    if (windowPreset === 'summary') {
      return [];
    }
    if (windowPreset === '10' && points.length > 10) {
      return points.slice(-10);
    }
    if (windowPreset === '25' && points.length > 25) {
      return points.slice(-25);
    }
    return points;
  }, [points, windowPreset]);

  const displayedSummary = useMemo(() => {
    if (
      (windowPreset === '10' || windowPreset === '25') &&
      visibleData.length > 0 &&
      visibleData.length < points.length
    ) {
      const cutoff = points.length - visibleData.length;
      const priorSlice = points.slice(
        Math.max(0, cutoff - visibleData.length),
        cutoff,
      );
      return summarizeMatchSamples(visibleData, priorSlice);
    }
    return summary;
  }, [points, summary, visibleData, windowPreset]);

  useEffect(() => {
    setBrushRange({
      startIndex: 0,
      endIndex: Math.max(0, visibleData.length - 1),
    });
  }, [visibleData.length]);

  if (points.length === 0) {
    return null;
  }

  const isSummaryOnly =
    !hideKpiTabs && isHighVolume && windowPreset === 'summary';
  const showBrush =
    !isHighVolume && windowPreset === 'all' && visibleData.length > 25;
  const meta = METRIC_METADATA[activeMetric];

  return (
    <section
      className={cn(
        'flex flex-col gap-3 border-0 bg-transparent md:gap-0 md:overflow-hidden md:rounded-xl md:border md:border-border md:bg-card',
        className,
      )}
    >
      {!hideKpiTabs && (
        <TrendKpiTabs
          summary={displayedSummary}
          sparkPoints={visibleData}
          activeMetric={activeMetric}
          onSelectMetric={setActiveMetric}
          isSummaryOnly={isSummaryOnly}
        />
      )}

      {isSummaryOnly ? (
        <HighVolumeSummaryBar
          totalMatches={points.length}
          windowPreset={windowPreset}
          onSelectPreset={setWindowPreset}
        />
      ) : (
        <div className="flex flex-col gap-3 md:p-5">
          <TrendChartHeader
            title={titleOverride ?? meta.title}
            subtitle={meta.subtitle}
            activeMetric={activeMetric}
            totalMatches={points.length}
            isHighVolume={isHighVolume}
            allowSummaryPreset={!hideKpiTabs}
            windowPreset={windowPreset}
            onSelectPreset={setWindowPreset}
            compactMetricPicker={
              hideKpiTabs
                ? { activeMetric, onSelectMetric: setActiveMetric }
                : undefined
            }
          />

          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[230px] w-full sm:h-[260px] lg:h-[290px]"
          >
            <ComposedChart
              accessibilityLayer
              data={visibleData}
              syncId={syncId}
              margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="shortLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={36}
                domain={activeMetric === 'winPct' ? [0, 100] : [0, 'auto']}
                tickFormatter={(val) =>
                  activeMetric === 'winPct' ? `${val}%` : `${val}`
                }
              />
              <ChartTooltip
                cursor={{
                  stroke: 'hsl(var(--border))',
                  strokeDasharray: '3 3',
                }}
                content={<TrendTooltipContent activeMetric={activeMetric} />}
              />

              {activeMetric === 'kd' && (
                <ReferenceLine
                  y={1}
                  stroke="#78716c"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
              )}
              {activeMetric === 'kd' && (
                <Line
                  type="linear"
                  dataKey="rollingKd"
                  stroke="var(--color-rollingKd)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}
              {activeMetric === 'kd' && (
                <Line
                  type="linear"
                  dataKey="kd"
                  stroke="transparent"
                  dot={<MatchOutcomeDot />}
                  activeDot={<MatchOutcomeDot radius={5} />}
                  isAnimationActive={false}
                />
              )}

              {activeMetric === 'kda' && (
                <ReferenceLine
                  y={1.5}
                  stroke="#78716c"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
              )}
              {activeMetric === 'kda' && (
                <Line
                  type="linear"
                  dataKey="rollingKda"
                  stroke="var(--color-rollingKda)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}
              {activeMetric === 'kda' && (
                <Line
                  type="linear"
                  dataKey="kda"
                  stroke="transparent"
                  dot={<MatchOutcomeDot />}
                  activeDot={<MatchOutcomeDot radius={5} />}
                  isAnimationActive={false}
                />
              )}

              {activeMetric === 'winPct' && (
                <ReferenceLine y={50} stroke="#78716c" strokeDasharray="4 4" />
              )}
              {activeMetric === 'winPct' && (
                <Area
                  type="linear"
                  dataKey="rollingWinPct"
                  stroke="var(--color-rollingWinPct)"
                  strokeWidth={2.5}
                  fill="var(--color-rollingWinPct)"
                  fillOpacity={0.1}
                  dot={<MatchOutcomeDot radius={3} />}
                  activeDot={<MatchOutcomeDot radius={5} />}
                  isAnimationActive={false}
                />
              )}

              {activeMetric === 'combat' && (
                <Line
                  type="linear"
                  dataKey="rollingKills"
                  stroke="var(--color-rollingKills)"
                  strokeWidth={2.2}
                  dot={visibleData.length <= 4}
                  isAnimationActive={false}
                />
              )}
              {activeMetric === 'combat' && (
                <Line
                  type="linear"
                  dataKey="rollingAssists"
                  stroke="var(--color-rollingAssists)"
                  strokeWidth={2}
                  dot={visibleData.length <= 4}
                  isAnimationActive={false}
                />
              )}
              {activeMetric === 'combat' && (
                <Line
                  type="linear"
                  dataKey="rollingDeaths"
                  stroke="var(--color-rollingDeaths)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={visibleData.length <= 4}
                  isAnimationActive={false}
                />
              )}

              {showBrush && (
                <Brush
                  dataKey="shortLabel"
                  height={20}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--secondary))"
                  travellerWidth={8}
                  startIndex={brushRange.startIndex}
                  endIndex={brushRange.endIndex}
                  onChange={(nextRange) => {
                    if (
                      typeof nextRange?.startIndex === 'number' &&
                      typeof nextRange?.endIndex === 'number'
                    ) {
                      setBrushRange({
                        startIndex: nextRange.startIndex,
                        endIndex: nextRange.endIndex,
                      });
                    }
                  }}
                />
              )}
            </ComposedChart>
          </ChartContainer>
        </div>
      )}
    </section>
  );
}
