import { Link } from 'react-router';
import type { MapTelemetryResult } from '~/lib/metrics';
import { cn } from '~/lib/utils';

import { KdBulletBar, MapSignalPill } from './map-signal-pill';

export interface MapMobileRowProps {
  map: MapTelemetryResult;
  showBestLoadout: boolean;
  loadoutBasePath?: string;
}

export function MapMobileRow({
  map,
  showBestLoadout,
  loadoutBasePath,
}: MapMobileRowProps) {
  return (
    <div className="flex flex-col gap-1.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {map.location}
          </span>
          {(map.signal === 'strong' || map.signal === 'swap') && (
            <MapSignalPill signal={map.signal} />
          )}
        </div>
        <div className="shrink-0 text-xs tabular-nums">
          <span
            className={cn(
              'font-bold',
              map.kd >= 1
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400',
            )}
          >
            {map.kd.toFixed(2)}
          </span>{' '}
          <span className="text-muted-foreground">K/D ·</span>{' '}
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {map.kda.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 truncate text-xs tabular-nums text-muted-foreground">
          {map.wins}W–{map.loses}L (
          <span
            className={
              map.winPct >= 50
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }
          >
            {map.winPct}%
          </span>
          )
          {showBestLoadout && map.bestLoadout && (
            <>
              {' · Best: '}
              {loadoutBasePath ? (
                <Link
                  to={`${loadoutBasePath}/${map.bestLoadout.snapshotId}`}
                  className="font-medium text-foreground/90 underline-offset-2 hover:underline"
                >
                  {map.bestLoadout.name}
                </Link>
              ) : (
                <span className="font-medium text-foreground/90">
                  {map.bestLoadout.name}
                </span>
              )}
            </>
          )}
        </div>
        <KdBulletBar kd={map.kd} compact />
      </div>
    </div>
  );
}

export interface MapMobileListProps {
  rows: MapTelemetryResult[];
  showBestLoadout: boolean;
  loadoutBasePath?: string;
}

export function MapMobileList({
  rows,
  showBestLoadout,
  loadoutBasePath,
}: MapMobileListProps) {
  return (
    <div className="flex flex-col divide-y divide-border/60 md:hidden">
      {rows.map((map) => (
        <MapMobileRow
          key={map.location}
          map={map}
          showBestLoadout={showBestLoadout}
          loadoutBasePath={loadoutBasePath}
        />
      ))}
    </div>
  );
}
