import { describe, expect, it } from 'vitest';
import type { MapTelemetryResult } from '~/lib/metrics';

import { buildMapFilterTabs, filterAndSortMaps } from './map-telemetry-types';

const sampleData: MapTelemetryResult[] = [
  {
    location: 'Eternity',
    avgKills: 18,
    avgDeaths: 9,
    avgAssists: 6,
    kd: 2.0,
    kda: 2.67,
    wins: 3,
    loses: 1,
    winRatio: 0.75,
    winPct: 75,
    count: 4,
    signal: 'strong',
  },
  {
    location: 'Cirrus Plaza',
    avgKills: 10,
    avgDeaths: 14,
    avgAssists: 2,
    kd: 0.71,
    kda: 0.86,
    wins: 0,
    loses: 2,
    winRatio: 0,
    winPct: 0,
    count: 2,
    signal: 'swap',
  },
  {
    location: 'Javelin-4',
    avgKills: 15,
    avgDeaths: 10,
    avgAssists: 5,
    kd: 1.5,
    kda: 2.0,
    wins: 1,
    loses: 0,
    winRatio: 1,
    winPct: 100,
    count: 1,
    signal: 'low-sample',
  },
];

describe('map-telemetry-types helpers', () => {
  it('filters maps by signal, multi-game count, and case-insensitive search query', () => {
    expect(filterAndSortMaps(sampleData, 'strong', '', 'count')).toHaveLength(
      1,
    );
    expect(filterAndSortMaps(sampleData, 'swap', '', 'count')[0].location).toBe(
      'Cirrus Plaza',
    );
    expect(filterAndSortMaps(sampleData, 'multi', '', 'count')).toHaveLength(2);
    expect(
      filterAndSortMaps(sampleData, 'all', 'jav', 'count')[0].location,
    ).toBe('Javelin-4');
  });

  it('sorts maps by count, kd, kda, and winPct', () => {
    expect(
      filterAndSortMaps(sampleData, 'all', '', 'count').map((m) => m.location),
    ).toEqual(['Eternity', 'Cirrus Plaza', 'Javelin-4']);
    expect(
      filterAndSortMaps(sampleData, 'all', '', 'winPct').map((m) => m.location),
    ).toEqual(['Javelin-4', 'Eternity', 'Cirrus Plaza']);
    expect(
      filterAndSortMaps(sampleData, 'all', '', 'kd').map((m) => m.location),
    ).toEqual(['Eternity', 'Javelin-4', 'Cirrus Plaza']);
    expect(
      filterAndSortMaps(sampleData, 'all', '', 'kda').map((m) => m.location),
    ).toEqual(['Eternity', 'Javelin-4', 'Cirrus Plaza']);
  });

  it('builds desktop and mobile filter tab labels with counts', () => {
    const tabs = buildMapFilterTabs({
      total: 9,
      strong: 2,
      swap: 1,
      multi: 5,
    });
    expect(tabs).toEqual([
      { key: 'all', label: 'All (9)', mobileLabel: 'All (9)' },
      { key: 'strong', label: 'Strong (2)', mobileLabel: 'Strong (2)' },
      { key: 'swap', label: 'Swap Candidates (1)', mobileLabel: 'Swap (1)' },
      { key: 'multi', label: '2+ Games (5)', mobileLabel: '2+g (5)' },
    ]);
  });
});
