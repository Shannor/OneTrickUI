import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { MapTelemetryResult } from '~/lib/metrics';

import { MapInsightsCallout, MapInsightsStrip } from './map-insights-strip';

const strongMap: MapTelemetryResult = {
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
};

const swapMap: MapTelemetryResult = {
  location: 'Cirrus Plaza',
  avgKills: 10,
  avgDeaths: 13,
  avgAssists: 3,
  kd: 0.77,
  kda: 1.0,
  wins: 0,
  loses: 2,
  winRatio: 0,
  winPct: 0,
  count: 2,
  signal: 'swap',
  bestLoadout: {
    snapshotId: 'snap-2',
    name: 'SMG Swap Build',
    kd: 1.45,
    winPct: 100,
    count: 2,
  },
};

describe('MapInsightsStrip and MapInsightsCallout', () => {
  it('returns null when both strongMaps and swapMaps are empty', () => {
    const { container } = render(
      <MemoryRouter>
        <MapInsightsStrip strongMaps={[]} swapMaps={[]} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders strong and swap callouts with swap loadout recommendation link', () => {
    render(
      <MemoryRouter>
        <MapInsightsStrip
          strongMaps={[strongMap]}
          swapMaps={[swapMap]}
          loadoutBasePath="/profile/u1/c/c1/loadouts"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Eternity')).toBeInTheDocument();
    expect(screen.getByText('2.00')).toBeInTheDocument();
    expect(screen.getByText('Cirrus Plaza')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Try SMG Swap Build/i }),
    ).toHaveAttribute('href', '/profile/u1/c/c1/loadouts/snap-2');
  });

  it('renders empty state message in MapInsightsCallout when hasItems is false', () => {
    render(
      <MapInsightsCallout
        tone="swap"
        title="Problem Maps"
        hasItems={false}
        emptyMessage="No problem maps flagged."
      />,
    );
    expect(screen.getByText('No problem maps flagged.')).toBeInTheDocument();
  });
});
