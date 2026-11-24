import React from 'react';
import { cn } from '~/lib/utils';

import type { TrendMetricKey } from './metrics-trend-config';

export type ChartLegendSwatch = 'outcome-dots' | 'solid' | 'dashed';

export interface ChartLegendItemProps {
  swatch: ChartLegendSwatch;
  colorClassName?: string;
  label: string;
}

export function ChartLegendItem({
  swatch,
  colorClassName = 'bg-emerald-500',
  label,
}: ChartLegendItemProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {swatch === 'outcome-dots' && (
        <span className="inline-flex items-center gap-0.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
      )}
      {swatch === 'solid' && (
        <span className={cn('h-0.5 w-4 rounded', colorClassName)} />
      )}
      {swatch === 'dashed' && (
        <span className={cn('w-4 border-t border-dashed', colorClassName)} />
      )}
      <span>{label}</span>
    </span>
  );
}

export interface ChartLegendProps {
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
}

export function ChartLegend({
  ariaLabel = 'Chart legend',
  className,
  children,
}: ChartLegendProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground',
        className,
      )}
    >
      {children}
    </div>
  );
}

export const TREND_LEGEND_ITEMS: Record<
  TrendMetricKey,
  ChartLegendItemProps[]
> = {
  kd: [
    { swatch: 'outcome-dots', label: 'Match K/D (Win / Loss)' },
    {
      swatch: 'solid',
      colorClassName: 'bg-emerald-500',
      label: 'Your 5-Game Avg',
    },
    {
      swatch: 'dashed',
      colorClassName: 'border-stone-400',
      label: '1.00 Even K/D',
    },
  ],
  kda: [
    { swatch: 'outcome-dots', label: 'Match Efficiency (Win / Loss)' },
    {
      swatch: 'solid',
      colorClassName: 'bg-amber-400',
      label: 'Your 5-Game Avg',
    },
    {
      swatch: 'dashed',
      colorClassName: 'border-stone-400',
      label: '1.50 Target',
    },
  ],
  winPct: [
    { swatch: 'outcome-dots', label: 'Match Outcome (Win / Loss)' },
    {
      swatch: 'solid',
      colorClassName: 'bg-emerald-500',
      label: '5-Game Win %',
    },
    {
      swatch: 'dashed',
      colorClassName: 'border-stone-400',
      label: '50% Even Win Rate',
    },
  ],
  combat: [
    {
      swatch: 'solid',
      colorClassName: 'bg-emerald-500',
      label: '5-Game Avg Kills',
    },
    {
      swatch: 'solid',
      colorClassName: 'bg-amber-400',
      label: '5-Game Avg Assists',
    },
    {
      swatch: 'dashed',
      colorClassName: 'border-t-2 border-red-500',
      label: '5-Game Avg Deaths',
    },
  ],
};

export interface TrendLegendProps {
  activeMetric: TrendMetricKey;
}

export function TrendLegend({ activeMetric }: TrendLegendProps) {
  return (
    <ChartLegend>
      {TREND_LEGEND_ITEMS[activeMetric].map((item) => (
        <ChartLegendItem key={item.label} {...item} />
      ))}
    </ChartLegend>
  );
}
