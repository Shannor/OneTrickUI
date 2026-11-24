import type { MapTelemetryResult } from '~/lib/metrics';

export type MapFilterTab = 'all' | 'strong' | 'swap' | 'multi';
export type MapSortKey = 'count' | 'winPct' | 'kd' | 'kda';

export interface MapFilterTabOption {
  key: MapFilterTab;
  label: string;
  mobileLabel: string;
}

export const MAP_PAGE_SIZE = 7;

export function filterAndSortMaps(
  data: readonly MapTelemetryResult[],
  filter: MapFilterTab,
  searchQuery: string,
  sortBy: MapSortKey,
): MapTelemetryResult[] {
  const query = searchQuery.trim().toLowerCase();

  return [...data]
    .filter((map) => {
      if (query && !map.location.toLowerCase().includes(query)) {
        return false;
      }
      if (filter === 'strong') return map.signal === 'strong';
      if (filter === 'swap') return map.signal === 'swap';
      if (filter === 'multi') return map.count >= 2;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'kd') return b.kd - a.kd || b.count - a.count;
      if (sortBy === 'kda') return b.kda - a.kda || b.count - a.count;
      if (sortBy === 'winPct') return b.winPct - a.winPct || b.count - a.count;
      return b.count - a.count || b.kd - a.kd;
    });
}

export function buildMapFilterTabs(counts: {
  total: number;
  strong: number;
  swap: number;
  multi: number;
}): MapFilterTabOption[] {
  return [
    {
      key: 'all',
      label: `All (${counts.total})`,
      mobileLabel: `All (${counts.total})`,
    },
    {
      key: 'strong',
      label: `Strong (${counts.strong})`,
      mobileLabel: `Strong (${counts.strong})`,
    },
    {
      key: 'swap',
      label: `Swap Candidates (${counts.swap})`,
      mobileLabel: `Swap (${counts.swap})`,
    },
    {
      key: 'multi',
      label: `2+ Games (${counts.multi})`,
      mobileLabel: `2+g (${counts.multi})`,
    },
  ];
}
