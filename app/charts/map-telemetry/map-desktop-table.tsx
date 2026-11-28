import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router';
import { WinLossRecord } from '~/components/win-loss-record';
import {
  EVEN_KD_TARGET,
  EVEN_WIN_RATE_PCT,
  type MapTelemetryResult,
} from '~/lib/metrics';
import { cn } from '~/lib/utils';

import { KdBulletBar, MapSignalPill, WinRateBar } from './map-signal-pill';
import type { MapSortKey } from './map-telemetry-types';

export interface SortableColumnHeaderProps {
  label: string;
  sortKey: MapSortKey;
  activeSortKey: MapSortKey;
  onSortChange: (key: MapSortKey) => void;
}

export function SortableColumnHeader({
  label,
  sortKey,
  activeSortKey,
  onSortChange,
}: SortableColumnHeaderProps) {
  const active = activeSortKey === sortKey;

  return (
    <button
      type="button"
      onClick={() => onSortChange(sortKey)}
      className={cn(
        'inline-flex items-center gap-1 uppercase tracking-wider transition-colors',
        active
          ? 'font-bold text-foreground'
          : 'font-semibold text-muted-foreground hover:text-foreground',
      )}
    >
      <span>{label}</span>
      {active && <ChevronDown className="h-3 w-3" aria-hidden="true" />}
    </button>
  );
}

export interface MapTrailingCellProps {
  map: MapTelemetryResult;
  showBestLoadout: boolean;
  loadoutBasePath?: string;
}

export function MapTrailingCell({
  map,
  showBestLoadout,
  loadoutBasePath,
}: MapTrailingCellProps) {
  if (!showBestLoadout) {
    return (
      <span className="text-muted-foreground">
        {map.avgKills.toFixed(1)} / {map.avgDeaths.toFixed(1)} /{' '}
        {map.avgAssists.toFixed(1)}
      </span>
    );
  }

  if (!map.bestLoadout) {
    return <span className="text-muted-foreground">Unlinked match</span>;
  }

  if (!loadoutBasePath) {
    return (
      <span>
        {map.bestLoadout.name} ({map.bestLoadout.kd.toFixed(2)})
      </span>
    );
  }

  return (
    <Link
      to={`${loadoutBasePath}/${map.bestLoadout.snapshotId}`}
      className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary hover:underline"
    >
      <span className="max-w-44 truncate">{map.bestLoadout.name}</span>
      <span
        className={cn(
          'font-semibold',
          map.bestLoadout.kd >= EVEN_KD_TARGET
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400',
        )}
      >
        ({map.bestLoadout.kd.toFixed(2)})
      </span>
    </Link>
  );
}

export interface MapDesktopTableProps {
  rows: MapTelemetryResult[];
  sortBy: MapSortKey;
  onSortChange: (key: MapSortKey) => void;
  showBestLoadout: boolean;
  loadoutBasePath?: string;
}

export function MapDesktopTable({
  rows,
  sortBy,
  onSortChange,
  showBestLoadout,
  loadoutBasePath,
}: MapDesktopTableProps) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs">
            <th className="px-5 py-2.5 font-semibold uppercase tracking-wider text-muted-foreground">
              Map
            </th>
            <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-muted-foreground">
              Signal
            </th>
            <th className="px-3 py-2.5">
              <SortableColumnHeader
                label="Matches"
                sortKey="count"
                activeSortKey={sortBy}
                onSortChange={onSortChange}
              />
            </th>
            <th className="px-3 py-2.5">
              <SortableColumnHeader
                label="Win Rate"
                sortKey="winPct"
                activeSortKey={sortBy}
                onSortChange={onSortChange}
              />
            </th>
            <th className="px-3 py-2.5">
              <SortableColumnHeader
                label="K/D (vs 1.0 Target)"
                sortKey="kd"
                activeSortKey={sortBy}
                onSortChange={onSortChange}
              />
            </th>
            <th className="px-3 py-2.5">
              <SortableColumnHeader
                label="Efficiency"
                sortKey="kda"
                activeSortKey={sortBy}
                onSortChange={onSortChange}
              />
            </th>
            <th className="px-5 py-2.5 font-semibold uppercase tracking-wider text-muted-foreground">
              {showBestLoadout ? 'Top Loadout on Map' : 'Avg K / D / A'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50 tabular-nums">
          {rows.map((map) => (
            <tr
              key={map.location}
              className="transition-colors hover:bg-secondary/20"
            >
              <td className="px-5 py-2.5 font-semibold text-foreground">
                {map.location}
              </td>
              <td className="px-3 py-2.5">
                <MapSignalPill signal={map.signal} />
              </td>
              <td className="px-3 py-2.5 font-medium text-foreground/90">
                {map.count}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <WinRateBar winPct={map.winPct} />
                  <span
                    className={cn(
                      'w-10 font-semibold',
                      map.winPct >= EVEN_WIN_RATE_PCT
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {map.winPct}%
                  </span>
                  <WinLossRecord
                    wins={map.wins}
                    losses={map.loses}
                    format="en-dash"
                    className="text-xs"
                  />
                </div>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <KdBulletBar kd={map.kd} />
                  <span
                    className={cn(
                      'font-bold',
                      map.kd >= EVEN_KD_TARGET
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {map.kd.toFixed(2)}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5 font-bold text-sky-600 dark:text-sky-400">
                {map.kda.toFixed(2)}
              </td>
              <td className="px-5 py-2.5 text-xs">
                <MapTrailingCell
                  map={map}
                  showBestLoadout={showBestLoadout}
                  loadoutBasePath={loadoutBasePath}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
