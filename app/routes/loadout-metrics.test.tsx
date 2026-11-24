import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Aggregate, getSnapshotAggregates } from '~/api';

import { LoadoutMetrics, loader } from './loadout-metrics';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;
}

const mockUseLoadoutData = vi.fn();
const mockUseOptionalProfileData = vi.fn();

vi.mock('~/hooks/use-route-loaders', () => ({
  useLoadoutData: () => mockUseLoadoutData(),
  useOptionalProfileData: () => mockUseOptionalProfileData(),
}));

vi.mock('~/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api')>();
  return {
    ...actual,
    getSnapshotAggregates: vi.fn(),
  };
});

function makeAggregate(
  id: string,
  location: string,
  kills: number,
  deaths: number,
  standing: number,
): Aggregate {
  return {
    id,
    activityId: `act-${id}`,
    sessionIds: ['sess-1'],
    characterIds: ['char-1'],
    snapshotIds: ['snap-1'],
    createdAt: new Date('2026-10-01T12:00:00Z'),
    activityDetails: {
      instanceId: `inst-${id}`,
      activity: 'Quickplay',
      location,
      period: new Date(`2026-10-0${id.slice(-1)}T12:00:00Z`),
      imageUrl: '/map.png',
      activityIcon: '/mode.png',
      estimatedGameMode: 'quickplay',
    } as any,
    snapshotLinks: {
      'char-1': {
        characterId: 'char-1',
        snapshotId: 'snap-1',
        confidenceLevel: 'high',
        confidenceSource: 'system',
        createdAt: new Date('2026-10-01T12:00:00Z'),
      },
    },
    performance: {
      'char-1': {
        playerStats: {
          kills: { value: kills },
          deaths: { value: deaths },
          assists: { value: 5 },
          standing: { value: standing },
        },
        weapons: {},
      } as any,
    },
  };
}

describe('loadout-metrics route loader and component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLoadoutData.mockReturnValue({
      snapshot: { id: 'snap-1', name: 'Ace + Matador' },
      path: 'https://d2onetrick.com/profile/user-1/c/char-1/loadouts/snap-1',
    });
    mockUseOptionalProfileData.mockReturnValue({
      profile: { id: 'user-1', displayName: 'Zone 6 Weegee' },
    });
  });

  it('loads snapshot aggregates cleanly', async () => {
    const aggs = [makeAggregate('agg-1', 'Javelin-4', 20, 10, 0)];
    vi.mocked(getSnapshotAggregates).mockResolvedValueOnce({
      data: aggs,
      error: undefined,
    } as any);

    const res = await loader({
      params: { id: 'user-1', characterId: 'char-1', snapshotId: 'snap-1' },
      context: new Map(),
      request: new Request(
        'http://localhost/profile/user-1/c/char-1/loadouts/snap-1/metrics',
      ),
    } as any);

    expect(res.error).toBeUndefined();
    expect(res.aggregates).toHaveLength(1);
  });

  it('renders MetricsTrendPanel and MapTelemetryPanel when aggregates exist', () => {
    const aggs = [
      makeAggregate('agg-1', 'Javelin-4', 22, 10, 0),
      makeAggregate('agg-2', 'Javelin-4', 18, 9, 0),
      makeAggregate('agg-3', 'Meltdown', 8, 15, 1),
      makeAggregate('agg-4', 'Meltdown', 7, 14, 1),
    ];

    render(
      <MemoryRouter>
        <LoadoutMetrics
          loaderData={{ aggregates: aggs, error: undefined }}
          params={{ id: 'user-1', characterId: 'char-1', snapshotId: 'snap-1' }}
          matches={[] as any}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('tablist', { name: 'Performance metric selector' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Map Telemetry & Swap Insights'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Javelin-4').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Meltdown').length).toBeGreaterThan(0);
  });

  it('renders Empty state when aggregates are empty', () => {
    render(
      <MemoryRouter>
        <LoadoutMetrics
          loaderData={{ aggregates: [], error: undefined }}
          params={{ id: 'user-1', characterId: 'char-1', snapshotId: 'snap-1' }}
          matches={[] as any}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('No Metrics Recorded Yet')).toBeInTheDocument();
  });
});
