import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { MapTelemetryResult } from '~/lib/metrics';

import { MapTelemetryPanel } from './MapTelemetryPanel';

const sampleMaps: MapTelemetryResult[] = [
  {
    location: 'Eternity',
    avgKills: 18.5,
    avgDeaths: 9.0,
    avgAssists: 7.9,
    kd: 2.06,
    kda: 2.94,
    wins: 2,
    loses: 1,
    winRatio: 0.67,
    winPct: 67,
    count: 3,
    signal: 'strong',
    bestLoadout: {
      snapshotId: 'snap-1',
      name: 'Pulse Build',
      kd: 2.06,
      winPct: 67,
      count: 3,
    },
  },
  {
    location: 'Cirrus Plaza',
    avgKills: 10.4,
    avgDeaths: 13.0,
    avgAssists: 3.1,
    kd: 0.8,
    kda: 1.04,
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
  },
  ...Array.from({ length: 7 }, (_, i) => ({
    location: `Extra Map ${i + 1}`,
    avgKills: 12,
    avgDeaths: 12,
    avgAssists: 4,
    kd: 1.0,
    kda: 1.33,
    wins: 1,
    loses: 0,
    winRatio: 1,
    winPct: 100,
    count: 1,
    signal: 'low-sample' as const,
  })),
];

describe('MapTelemetryPanel', () => {
  it('renders Strong and Swap callouts, filters by signal, searches by name, and paginates', () => {
    render(
      <MemoryRouter>
        <MapTelemetryPanel
          data={sampleMaps}
          showBestLoadout
          loadoutBasePath="/profile/u1/c/c1/loadouts"
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Strong Maps \(2\+ Matches/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Problem \/ Swap Candidates/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Try SMG Swap Build')).toBeInTheDocument();

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next map page' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    const desktopFilterGroup = screen.getByRole('tablist', {
      name: 'Filter maps by performance signal',
    });
    const swapTab = desktopFilterGroup.querySelectorAll('button')[2];
    fireEvent.click(swapTab);
    expect(screen.getAllByText('Cirrus Plaza').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Search maps'), {
      target: { value: 'nonexistent' },
    });
    expect(
      screen.getByText('No maps match the current filter.'),
    ).toBeInTheDocument();
  });

  it('returns null when data is empty', () => {
    const { container } = render(
      <MemoryRouter>
        <MapTelemetryPanel data={[]} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });
});
