import React from 'react';
import type { MatchPoint } from '~/lib/metrics';
import { cn } from '~/lib/utils';

import type { TrendMetricKey } from './metrics-trend-config';

export interface MatchOutcomeDotProps {
  cx?: number;
  cy?: number;
  payload?: MatchPoint;
  radius?: number;
}

export function MatchOutcomeDot({
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

export interface TrendTooltipRowProps {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  valueClassName?: string;
}

export function TrendTooltipRow({
  label,
  value,
  detail,
  valueClassName = 'font-semibold text-foreground',
}: TrendTooltipRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums', valueClassName)}>
        {value}
        {detail && (
          <>
            {' '}
            <span className="font-normal text-muted-foreground">{detail}</span>
          </>
        )}
      </span>
    </div>
  );
}

export function buildTooltipRows(
  point: MatchPoint,
  activeMetric: TrendMetricKey,
): TrendTooltipRowProps[] {
  const combatSummary = `(${point.kills}K / ${point.deaths}D / ${point.assists}A)`;

  switch (activeMetric) {
    case 'kd':
      return [
        {
          label: 'This Match K/D',
          value: point.kd.toFixed(2),
          detail: combatSummary,
        },
        {
          label: 'Your 5-Game Avg',
          value: point.rollingKd.toFixed(2),
          valueClassName: 'font-bold text-emerald-600 dark:text-emerald-400',
        },
      ];
    case 'kda':
      return [
        {
          label: 'This Match Efficiency',
          value: point.kda.toFixed(2),
          detail: combatSummary,
        },
        {
          label: 'Your 5-Game Avg',
          value: point.rollingKda.toFixed(2),
          valueClassName: 'font-bold text-amber-600 dark:text-amber-400',
        },
      ];
    case 'winPct':
      return [
        {
          label: 'This Match K/D',
          value: `${point.kd.toFixed(2)} (${point.kills}K / ${point.deaths}D)`,
        },
        {
          label: '5-Game Win Rate',
          value: `${point.rollingWinPct}%`,
          valueClassName: cn(
            'font-bold',
            point.rollingWinPct >= 50
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400',
          ),
        },
      ];
    case 'combat':
      return [
        {
          label: 'This Match',
          value: `${point.kills}K / ${point.deaths}D / ${point.assists}A`,
        },
        {
          label: '5-Game Avg',
          value: `${point.rollingKills.toFixed(1)}K / ${point.rollingDeaths.toFixed(1)}D / ${point.rollingAssists.toFixed(1)}A`,
          valueClassName: 'font-bold text-foreground',
        },
      ];
  }
}

export interface TrendTooltipContentProps {
  active?: boolean;
  payload?: Array<{ payload?: MatchPoint }>;
  activeMetric: TrendMetricKey;
}

export function TrendTooltipContent({
  active,
  payload,
  activeMetric,
}: TrendTooltipContentProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) {
    return null;
  }

  const rows = buildTooltipRows(point, activeMetric);

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
        {rows.map((row) => (
          <TrendTooltipRow key={row.label} {...row} />
        ))}
      </div>
    </div>
  );
}
