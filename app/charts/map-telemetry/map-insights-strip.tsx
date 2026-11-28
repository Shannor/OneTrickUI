import { ArrowRight } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router';
import { WinLossRecord } from '~/components/win-loss-record';
import { EVEN_KD_TARGET, type MapTelemetryResult } from '~/lib/metrics';
import { cn } from '~/lib/utils';

import {
  MAX_STRONG_INSIGHT_MAPS,
  MAX_SWAP_INSIGHT_MAPS,
  RECOMMENDED_SWAP_LOADOUT_MIN_KD,
} from './map-telemetry-types';

export type MapCalloutTone = 'strong' | 'swap';

export interface MapInsightsCalloutProps {
  tone: MapCalloutTone;
  title: string;
  hasItems: boolean;
  emptyMessage: string;
  className?: string;
  children?: React.ReactNode;
}

export function MapInsightsCallout({
  tone,
  title,
  hasItems,
  emptyMessage,
  className,
  children,
}: MapInsightsCalloutProps) {
  const isStrong = tone === 'strong';

  return (
    <div
      className={cn(
        'border-l-2 pl-3 md:px-5 md:py-3',
        isStrong ? 'border-emerald-500' : 'border-red-500',
        className,
      )}
    >
      <div
        className={cn(
          'text-xs font-bold uppercase tracking-wider',
          isStrong
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400',
        )}
      >
        {title}
      </div>
      {hasItems ? (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/90">
          {children}
        </div>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}

export interface MapInsightItemProps {
  map: MapTelemetryResult;
  tone: MapCalloutTone;
  loadoutBasePath?: string;
}

export function MapInsightItem({
  map,
  tone,
  loadoutBasePath,
}: MapInsightItemProps) {
  const kdClassName =
    tone === 'strong'
      ? 'text-emerald-600 dark:text-emerald-400'
      : map.kd < EVEN_KD_TARGET
        ? 'text-red-600 dark:text-red-400'
        : 'text-foreground';

  const showSwapLink =
    tone === 'swap' &&
    Boolean(
      loadoutBasePath &&
      map.bestLoadout &&
      map.bestLoadout.kd >= RECOMMENDED_SWAP_LOADOUT_MIN_KD,
    );

  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-semibold">{map.location}</span>
      <span className={cn('font-semibold tabular-nums', kdClassName)}>
        {map.kd.toFixed(2)}
      </span>
      <WinLossRecord
        wins={map.wins}
        losses={map.loses}
        format="numeric-parens"
      />
      {showSwapLink && map.bestLoadout && loadoutBasePath && (
        <Link
          to={`${loadoutBasePath}/${map.bestLoadout.snapshotId}`}
          className="inline-flex items-center gap-0.5 text-primary hover:underline"
        >
          <ArrowRight className="h-3 w-3" />
          <span>Try {map.bestLoadout.name}</span>
        </Link>
      )}
    </span>
  );
}

export interface MapInsightsStripProps {
  strongMaps: MapTelemetryResult[];
  swapMaps: MapTelemetryResult[];
  loadoutBasePath?: string;
}

export function MapInsightsStrip({
  strongMaps,
  swapMaps,
  loadoutBasePath,
}: MapInsightsStripProps) {
  if (strongMaps.length === 0 && swapMaps.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-border/80 pb-3.5 md:grid-cols-2 md:gap-0 md:bg-secondary/20 md:pb-0">
      <MapInsightsCallout
        tone="strong"
        title="Strong Maps (2+ Matches · Keep Equipped)"
        hasItems={strongMaps.length > 0}
        emptyMessage="Play 2+ matches on a map with strong ratios to unlock keep-equipped signals."
        className="md:border-r md:border-r-border/70"
      >
        {strongMaps.slice(0, MAX_STRONG_INSIGHT_MAPS).map((map) => (
          <MapInsightItem key={map.location} map={map} tone="strong" />
        ))}
      </MapInsightsCallout>

      <MapInsightsCallout
        tone="swap"
        title="Problem / Swap Candidates (2+ Matches · Low K/D or Win %)"
        hasItems={swapMaps.length > 0}
        emptyMessage="No multi-match problem maps flagged in this window."
      >
        {swapMaps.slice(0, MAX_SWAP_INSIGHT_MAPS).map((map) => (
          <MapInsightItem
            key={map.location}
            map={map}
            tone="swap"
            loadoutBasePath={loadoutBasePath}
          />
        ))}
      </MapInsightsCallout>
    </div>
  );
}
