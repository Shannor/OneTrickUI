import { useEffect, useMemo, useState } from 'react';
import type { MapTelemetryResult } from '~/lib/metrics';
import { cn } from '~/lib/utils';

import { MapDesktopTable } from './map-desktop-table';
import {
  MapFilterToolbar,
  MapMobileFilterTabs,
  MapPaginationFooter,
} from './map-filter-toolbar';
import { MapInsightsStrip } from './map-insights-strip';
import { MapMobileList } from './map-mobile-list';
import {
  MAP_PAGE_SIZE,
  type MapFilterTab,
  type MapSortKey,
  buildMapFilterTabs,
  filterAndSortMaps,
} from './map-telemetry-types';

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
        .filter((map) => map.signal === 'strong')
        .sort((a, b) => b.kd - a.kd || b.count - a.count),
    [data],
  );

  const swapMaps = useMemo(
    () =>
      [...data]
        .filter((map) => map.signal === 'swap')
        .sort((a, b) => a.kd - b.kd || b.count - a.count),
    [data],
  );

  const multiCount = useMemo(
    () => data.filter((map) => map.count >= 2).length,
    [data],
  );

  const filteredAndSorted = useMemo(
    () => filterAndSortMaps(data, filter, searchQuery, sortBy),
    [data, filter, searchQuery, sortBy],
  );

  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery, sortBy]);

  if (data.length === 0) {
    return null;
  }

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSorted.length / MAP_PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * MAP_PAGE_SIZE;
  const pagedRows = filteredAndSorted.slice(startIdx, startIdx + MAP_PAGE_SIZE);

  const filterTabs = buildMapFilterTabs({
    total: data.length,
    strong: strongMaps.length,
    swap: swapMaps.length,
    multi: multiCount,
  });

  return (
    <section
      className={cn(
        'flex flex-col gap-3 border-0 bg-transparent md:gap-0 md:overflow-hidden md:rounded-xl md:border md:border-border md:bg-card',
        className,
      )}
    >
      <MapFilterToolbar
        title={title}
        description={description}
        sortBy={sortBy}
        onSortChange={setSortBy}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
        filterTabs={filterTabs}
      />

      <MapInsightsStrip
        strongMaps={strongMaps}
        swapMaps={swapMaps}
        loadoutBasePath={loadoutBasePath}
      />

      <MapMobileFilterTabs
        filter={filter}
        onFilterChange={setFilter}
        filterTabs={filterTabs}
      />

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

      <MapPaginationFooter
        page={safePage}
        totalPages={totalPages}
        pageSize={MAP_PAGE_SIZE}
        totalItems={filteredAndSorted.length}
        onPageChange={setPage}
      />
    </section>
  );
}
