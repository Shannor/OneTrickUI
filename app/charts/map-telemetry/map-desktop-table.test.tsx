import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { MapTelemetryResult } from '~/lib/metrics';

import { MapDesktopTable } from './map-desktop-table';

const rows: MapTelemetryResult[] = [
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
    location: 'Anomaly',
    avgKills: 11.0,
    avgDeaths: 12.0,
    avgAssists: 4.0,
    kd: 0.92,
    kda: 1.25,
    wins: 1,
    loses: 2,
    winRatio: 0.33,
    winPct: 33,
    count: 3,
    signal: 'swap',
  },
];

describe('MapDesktopTable', () => {
  it('renders rows, triggers sort changes on header clicks, and links top loadouts', () => {
    const onSortChange = vi.fn();

    render(
      <MemoryRouter>
        <MapDesktopTable
          rows={rows}
          sortBy="count"
          onSortChange={onSortChange}
          showBestLoadout
          loadoutBasePath="/profile/u1/c/c1/loadouts"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Eternity')).toBeInTheDocument();
    expect(screen.getByText('Pulse Build')).toBeInTheDocument();
    expect(screen.getByText('Unlinked match')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'K/D (vs 1.0 Target)' }),
    );
    expect(onSortChange).toHaveBeenCalledWith('kd');
  });

  it('renders Avg K / D / A column when showBestLoadout is false', () => {
    render(
      <MemoryRouter>
        <MapDesktopTable
          rows={[rows[0]]}
          sortBy="kd"
          onSortChange={vi.fn()}
          showBestLoadout={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Avg K / D / A')).toBeInTheDocument();
    expect(screen.getByText('18.5 / 9.0 / 7.9')).toBeInTheDocument();
  });
});
