import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import type { MapSignal, MapTelemetryResult } from '~/lib/metrics';
import { cn } from '~/lib/utils';

export type MapFilterTab = 'all' | 'strong' | 'swap' | 'multi';
export type MapSortKey = 'count' | 'winPct' | 'kd' | 'kda';

const PAGE_SIZE = 7;

export function MapSignalPill({ signal }: { signal: MapSignal }) {
  if (signal === 'strong') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
        Strong
      </span>
    );
  }
  if (signal === 'swap') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
        Swap
      </span>
    );
  }
  if (signal === 'low-sample') {
    return (
      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        1g
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      Neutral
    </span>
  );
}

interface MapInsightsStripProps {
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
      <div className="border-l-2 border-emerald-500 pl-3 md:border-r md:border-r-border/70 md:px-5 md:py-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Strong Maps (2+ Matches · Keep Equipped)
        </div>
        {strongMaps.length > 0 ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/90">
            {strongMaps.slice(0, 4).map((m) => (
              <span key={m.location} className="inline-flex items-center gap-1">
                <span className="font-semibold">{m.location}</span>
                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {m.kd.toFixed(2)}
                </span>
                <span className="text-muted-foreground">
                  ({m.wins}-{m.loses})
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Play 2+ matches on a map with strong ratios to unlock keep-equipped
            signals.
          </p>
        )}
      </div>

      <div className="border-l-2 border-red-500 pl-3 md:px-5 md:py-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
          Problem / Swap Candidates (2+ Matches · Low K/D or Win %)
        </div>
        {swapMaps.length > 0 ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/90">
            {swapMaps.slice(0, 3).map((m) => (
              <span key={m.location} className="inline-flex items-center gap-1">
                <span className="font-semibold">{m.location}</span>
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    m.kd < 1
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400',
                  )}
                >
                  {m.kd.toFixed(2)}
                </span>
                <span className="text-muted-foreground">
                  ({m.wins}-{m.loses})
                </span>
                {loadoutBasePath && m.bestLoadout && m.bestLoadout.kd >= 1.1 && (
                  <Link
                    to={`${loadoutBasePath}/${m.bestLoadout.snapshotId}`}
                    className="inline-flex items-center gap-0.5 text-primary hover:underline"
                  >
                    <ArrowRight className="h-3 w-3" />
                    <span>Try {m.bestLoadout.name}</span>
                  </Link>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            No multi-match problem maps flagged in this window.
          </p>
        )}
      </div>
    </div>
  );
}

interface KdBulletBarProps {
  kd: number;
  compact?: boolean;
}

export function KdBulletBar({ kd, compact = false }: KdBulletBarProps) {
  const fillPct = Math.min(100, (kd / 3.0) * 100);
  const isPositive = kd >= 1.0;

  return (
    <div
      className={cn(
        'relative rounded-full bg-secondary',
        compact ? 'h-1.5 w-20' : 'h-2 w-28',
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -bottom-0.5 -top-0.5 left-1/3 w-[1.5px] bg-muted-foreground/70"
      />
      <div
        className={cn(
          'h-full rounded-full',
          isPositive ? 'bg-emerald-500' : 'bg-red-500',
        )}
        style={{ width: `${fillPct}%` }}
      />
    </div>
  );
}

interface MapDesktopTableProps {
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
  const renderSortHeader = (label: string, key: MapSortKey) => {
    const active = sortBy === key;
    return (
      <button
        type="button"
        onClick={() => onSortChange(key)}
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
  };

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[10px]">
            <th className="px-5 py-2.5 font-semibold uppercase tracking-wider text-muted-foreground">
              Map
            </th>
            <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-muted-foreground">
              Signal
            </th>
            <th className="px-3 py-2.5">{renderSortHeader('Matches', 'count')}</th>
            <th className="px-3 py-2.5">{renderSortHeader('Win Rate', 'winPct')}</th>
            <th className="px-3 py-2.5">
              {renderSortHeader('K/D (vs 1.0 Target)', 'kd')}
            </th>
            <th className="px-3 py-2.5">{renderSortHeader('Efficiency', 'kda')}</th>
            <th className="px-5 py-2.5 font-semibold uppercase tracking-wider text-muted-foreground">
              {showBestLoadout ? 'Top Loadout on Map' : 'Avg K / D / A'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50 tabular-nums">
          {rows.map((m) => (
            <tr
              key={m.location}
              className="transition-colors hover:bg-secondary/20"
            >
              <td className="px-5 py-2.5 font-semibold text-foreground">
                {m.location}
              </td>
              <td className="px-3 py-2.5">
                <MapSignalPill signal={m.signal} />
              </td>
              <td className="px-3 py-2.5 font-medium text-foreground/90">
                {m.count}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-red-600/85">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${m.winPct}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      'w-10 font-semibold',
                      m.winPct >= 50
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {m.winPct}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {m.wins}W–{m.loses}L
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <KdBulletBar kd={m.kd} />
                  <span
                    className={cn(
                      'font-bold',
                      m.kd >= 1
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {m.kd.toFixed(2)}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5 font-bold text-amber-600 dark:text-amber-400">
                {m.kda.toFixed(2)}
              </td>
              <td className="px-5 py-2.5 text-xs">
                {showBestLoadout ? (
                  m.bestLoadout ? (
                    loadoutBasePath ? (
                      <Link
                        to={`${loadoutBasePath}/${m.bestLoadout.snapshotId}`}
                        className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary hover:underline"
                      >
                        <span className="max-w-[180px] truncate">
                          {m.bestLoadout.name}
                        </span>
                        <span
                          className={cn(
                            'font-semibold',
                            m.bestLoadout.kd >= 1
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400',
                          )}
                        >
                          ({m.bestLoadout.kd.toFixed(2)})
                        </span>
                      </Link>
                    ) : (
                      <span>
                        {m.bestLoadout.name} ({m.bestLoadout.kd.toFixed(2)})
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground">Unlinked match</span>
                  )
                ) : (
                  <span className="text-muted-foreground">
                    {m.avgKills.toFixed(1)} / {m.avgDeaths.toFixed(1)} /{' '}
                    {m.avgAssists.toFixed(1)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface MapMobileListProps {
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
      {rows.map((m) => (
        <div key={m.location} className="flex flex-col gap-1.5 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">
                {m.location}
              </span>
              {(m.signal === 'strong' || m.signal === 'swap') && (
                <MapSignalPill signal={m.signal} />
              )}
            </div>
            <div className="shrink-0 text-xs tabular-nums">
              <span
                className={cn(
                  'font-bold',
                  m.kd >= 1
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400',
                )}
              >
                {m.kd.toFixed(2)}
              </span>{' '}
              <span className="text-muted-foreground">K/D ·</span>{' '}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {m.kda.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 truncate text-xs text-muted-foreground tabular-nums">
              {m.wins}W–{m.loses}L (
              <span
                className={
                  m.winPct >= 50
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }
              >
                {m.winPct}%
              </span>
              )
              {showBestLoadout && m.bestLoadout && (
                <>
                  {' · Best: '}
                  {loadoutBasePath ? (
                    <Link
                      to={`${loadoutBasePath}/${m.bestLoadout.snapshotId}`}
                      className="font-medium text-foreground/90 underline-offset-2 hover:underline"
                    >
                      {m.bestLoadout.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground/90">
                      {m.bestLoadout.name}
                    </span>
                  )}
                </>
              )}
            </div>
            <KdBulletBar kd={m.kd} compact />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface MapTelemetryPanelProps {
  data: MapTelemetryResult[];
  title?: string;
  description?: string;
  showBestLoadout?: boolean;
  loadoutBasePath?: string;
  className?: string;
}

export function MapTelemetryPanel({
  data,
  title = 'Map Telemetry & Swap Insights',
  description = 'Pinpoints strong maps to keep equipped vs. problem maps where swapping is recommended.',
  showBestLoadout = false,
  loadoutBasePath,
  className,
}: MapTelemetryPanelProps) {
  const [filter, setFilter] = useState<MapFilterTab>('all');
  const [sortBy, setSortBy] = useState<MapSortKey>('count');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const strongMaps = useMemo(
    () =>
      [...data]
        .filter((m) => m.signal === 'strong')
        .sort((a, b) => b.kd - a.kd || b.count - a.count),
    [data],
  );

  const swapMaps = useMemo(
    () =>
      [...data]
        .filter((m) => m.signal === 'swap')
        .sort((a, b) => a.kd - b.kd || b.count - a.count),
    [data],
  );

  const multiCount = useMemo(
    () => data.filter((m) => m.count >= 2).length,
    [data],
  );

  const filteredAndSorted = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return [...data]
      .filter((m) => {
        if (query && !m.location.toLowerCase().includes(query)) {
          return false;
        }
        if (filter === 'strong') return m.signal === 'strong';
        if (filter === 'swap') return m.signal === 'swap';
        if (filter === 'multi') return m.count >= 2;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'kd') return b.kd - a.kd || b.count - a.count;
        if (sortBy === 'kda') return b.kda - a.kda || b.count - a.count;
        if (sortBy === 'winPct') return b.winPct - a.winPct || b.count - a.count;
        return b.count - a.count || b.kd - a.kd;
      });
  }, [data, filter, searchQuery, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery, sortBy]);

  if (data.length === 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pagedRows = filteredAndSorted.slice(startIdx, startIdx + PAGE_SIZE);

  const filterTabs: Array<{ key: MapFilterTab; label: string; mobileLabel: string }> = [
    { key: 'all', label: `All (${data.length})`, mobileLabel: `All (${data.length})` },
    {
      key: 'strong',
      label: `Strong (${strongMaps.length})`,
      mobileLabel: `Strong (${strongMaps.length})`,
    },
    {
      key: 'swap',
      label: `Swap Candidates (${swapMaps.length})`,
      mobileLabel: `Swap (${swapMaps.length})`,
    },
    {
      key: 'multi',
      label: `2+ Games (${multiCount})`,
      mobileLabel: `2+g (${multiCount})`,
    },
  ];

  return (
    <section
      className={cn(
        'flex flex-col gap-3 border-0 bg-transparent md:gap-0 md:overflow-hidden md:rounded-xl md:border md:border-border md:bg-card',
        className,
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:border-b md:border-border md:px-5 md:py-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="font-heading text-lg font-semibold tracking-wide text-foreground sm:text-xl">
              {title}
            </h4>
            <p className="hidden text-xs text-muted-foreground sm:block">
              {description}
            </p>
          </div>

          <div className="w-[132px] md:hidden">
            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val as MapSortKey)}
            >
              <SelectTrigger aria-label="Sort maps" className="h-8 text-xs">
                <SelectValue placeholder="Sort: Games" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Sort: Games</SelectItem>
                <SelectItem value="kd">Sort: K/D</SelectItem>
                <SelectItem value="winPct">Sort: Win %</SelectItem>
                <SelectItem value="kda">Sort: Efficiency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-44">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search map..."
              aria-label="Search maps"
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div
            role="tablist"
            aria-label="Filter maps by performance signal"
            className="hidden items-center gap-1 rounded-lg border border-border bg-secondary/40 p-0.5 md:inline-flex"
          >
            {filterTabs.map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'bg-secondary font-semibold text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <MapInsightsStrip
        strongMaps={strongMaps}
        swapMaps={swapMaps}
        loadoutBasePath={loadoutBasePath}
      />

      <div
        role="tablist"
        aria-label="Mobile map signal filter"
        className="flex items-center gap-4 border-b border-border md:hidden"
      >
        {filterTabs.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'border-b-2 pb-2 text-xs transition-colors',
                active
                  ? 'border-b-primary font-semibold text-foreground'
                  : 'border-b-transparent text-muted-foreground',
              )}
            >
              {tab.mobileLabel}
            </button>
          );
        })}
      </div>

      {pagedRows.length > 0 ? (
        <>
          <MapDesktopTable
            rows={pagedRows}
            sortBy={sortBy}
            onSortChange={setSortBy}
            showBestLoadout={showBestLoadout}
            loadoutBasePath={loadoutBasePath}
          />
          <MapMobileList
            rows={pagedRows}
            showBestLoadout={showBestLoadout}
            loadoutBasePath={loadoutBasePath}
          />
        </>
      ) : (
        <div className="py-8 text-center text-xs text-muted-foreground md:px-5">
          No maps match the current filter.
        </div>
      )}

      {filteredAndSorted.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground md:px-5 md:py-3">
          <span>
            Showing{' '}
            <strong className="font-semibold text-foreground">
              {startIdx + 1}–
              {Math.min(startIdx + PAGE_SIZE, filteredAndSorted.length)}
            </strong>{' '}
            of{' '}
            <strong className="font-semibold text-foreground">
              {filteredAndSorted.length}
            </strong>{' '}
            maps
          </span>

          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous map page"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>
            <span className="px-2 tabular-nums">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next map page"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:pointer-events-none disabled:opacity-40"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
