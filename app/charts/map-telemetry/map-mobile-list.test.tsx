import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { MapTelemetryResult } from '~/lib/metrics';

import { MapMobileList } from './map-mobile-list';

const sampleRow: MapTelemetryResult = {
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
};

describe('MapMobileList', () => {
  it('renders mobile rows with signal pill, win record, and optional best loadout link', () => {
    render(
      <MemoryRouter>
        <MapMobileList
          rows={[sampleRow]}
          showBestLoadout
          loadoutBasePath="/profile/u1/c/c1/loadouts"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Eternity')).toBeInTheDocument();
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.getByText('2.06')).toBeInTheDocument();
    expect(screen.getByText('2.94')).toHaveClass('text-sky-600');
    expect(screen.getByText('2.94')).not.toHaveClass('text-amber-600');
    expect(screen.getByRole('link', { name: 'Pulse Build' })).toHaveAttribute(
      'href',
      '/profile/u1/c/c1/loadouts/snap-1',
    );
  });
});
