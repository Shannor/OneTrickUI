import type { MatchPoint, TelemetrySummary } from '~/lib/metrics';
import { cn } from '~/lib/utils';

import { type TrendMetricKey, formatSignedDelta } from './metrics-trend-config';
import { MiniSparkline } from './mini-sparkline';

export interface KpiItemDescriptor {
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

export function buildKpiItems(
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

export interface KpiStatCellContentProps {
  item: KpiItemDescriptor;
  showSparkline: boolean;
}

export function KpiStatCellContent({
  item,
  showSparkline,
}: KpiStatCellContentProps) {
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

export interface TrendKpiTabsProps {
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
