import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type Aggregate,
  getSessionAggregates,
  getSnapshotAggregates,
  getSnapshots,
  getUserSessions,
} from '~/api';

import { CharacterMetrics, loader } from './character-metrics';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;
}

const mockUseOptionalProfileData = vi.fn();

vi.mock('~/hooks/use-route-loaders', () => ({
  useOptionalProfileData: () => mockUseOptionalProfileData(),
}));

vi.mock('~/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api')>();
  return {
    ...actual,
    getUserSessions: vi.fn(),
    getSnapshots: vi.fn(),
    getSessionAggregates: vi.fn(),
    getSnapshotAggregates: vi.fn(),
  };
});

function makeAggregate(
  id: string,
  location: string,
  kills: number,
  deaths: number,
  standing: number,
  snapshotId?: string,
): Aggregate {
  return {
    id,
    activityId: `act-${id}`,
    sessionIds: ['sess-1'],
    characterIds: ['char-1'],
    snapshotIds: snapshotId ? [snapshotId] : [],
    createdAt: new Date('2026-10-01T12:00:00Z'),
    activityDetails: {
      instanceId: `inst-${id}`,
      activity: 'Trials of Osiris',
      location,
      period: new Date(`2026-10-0${id.slice(-1)}T12:00:00Z`),
      imageUrl: '/map.png',
      activityIcon: '/mode.png',
      estimatedGameMode: 'trials',
    } as any,
    snapshotLinks: snapshotId
      ? {
          'char-1': {
            characterId: 'char-1',
            snapshotId,
            confidenceLevel: 'high',
            confidenceSource: 'system',
            createdAt: new Date('2026-10-01T12:00:00Z'),
          },
        }
      : {},
    performance: {
      'char-1': {
        playerStats: {
          kills: { value: kills },
          deaths: { value: deaths },
          assists: { value: 4 },
          standing: { value: standing },
        },
        weapons: {},
      } as any,
    },
  };
}

describe('character-metrics route loader and component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOptionalProfileData.mockReturnValue({
      type: 'owner',
      profile: {
        id: 'user-1',
        displayName: 'Zone 6 Weegee',
        characters: [{ id: 'char-1', class: 'Hunter' }],
      },
    });
  });

  it('deduplicates aggregates across sessions and loadouts and merges snapshot names in loader', async () => {
    const sharedAgg = makeAggregate('agg-1', 'Javelin-4', 18, 9, 0, 'snap-a');
    const snapOnlyAgg = makeAggregate('agg-2', 'Burnout', 16, 10, 0);

    vi.mocked(getUserSessions)
      .mockResolvedValueOnce({
        data: [{ id: 'sess-1' }],
        error: undefined,
      } as any)
      .mockResolvedValueOnce({
        data: [],
        error: undefined,
      } as any);

    vi.mocked(getSnapshots).mockResolvedValueOnce({
      data: {
        items: [{ id: 'snap-b', name: 'Solar Pulse Build' }],
      },
      error: undefined,
    } as any);

    vi.mocked(getSessionAggregates).mockResolvedValueOnce({
      data: {
        aggregates: [sharedAgg],
        snapshots: {
          'snap-a': { id: 'snap-a', name: 'Prismatic Hand Cannon' },
        },
      },
      error: undefined,
    } as any);

    vi.mocked(getSnapshotAggregates).mockResolvedValueOnce({
      data: [sharedAgg, snapOnlyAgg],
      error: undefined,
    } as any);

    const res = await loader({
      params: { id: 'user-1', characterId: 'char-1' },
      context: new Map(),
      request: new Request('http://localhost/profile/user-1/c/char-1/metrics'),
    } as any);

    expect(res.error).toBeUndefined();
    expect(res.aggregates).toHaveLength(2);
    expect(res.snapshots['snap-a']?.name).toBe('Prismatic Hand Cannon');
    expect(res.snapshots['snap-b']?.name).toBe('Solar Pulse Build');
    const normalizedSecond = res.aggregates.find((a) => a.id === 'agg-2');
    expect(normalizedSecond?.snapshotLinks['char-1']?.snapshotId).toBe(
      'snap-b',
    );
  });

  it('backfills snapshotLinks on an unlinked session aggregate when confirmed by getSnapshotAggregates', async () => {
    const unlinkedSessionAgg = makeAggregate('agg-3', 'Endless Vale', 20, 8, 0);
    const snapshotConfirmedAgg = makeAggregate(
      'agg-3',
      'Endless Vale',
      20,
      8,
      0,
    );

    vi.mocked(getUserSessions)
      .mockResolvedValueOnce({
        data: [{ id: 'sess-1' }],
        error: undefined,
      } as any)
      .mockResolvedValueOnce({
        data: [],
        error: undefined,
      } as any);

    vi.mocked(getSnapshots).mockResolvedValueOnce({
      data: {
        items: [{ id: 'snap-b', name: 'Solar Pulse Build' }],
      },
      error: undefined,
    } as any);

    vi.mocked(getSessionAggregates).mockResolvedValueOnce({
      data: {
        aggregates: [unlinkedSessionAgg],
        snapshots: {},
      },
      error: undefined,
    } as any);

    vi.mocked(getSnapshotAggregates).mockResolvedValueOnce({
      data: [snapshotConfirmedAgg],
      error: undefined,
    } as any);

    const res = await loader({
      params: { id: 'user-1', characterId: 'char-1' },
      context: new Map(),
      request: new Request('http://localhost/profile/user-1/c/char-1/metrics'),
    } as any);

    expect(res.aggregates).toHaveLength(1);
    expect(res.aggregates[0].snapshotLinks['char-1']?.snapshotId).toBe(
      'snap-b',
    );
    expect(res.partialFailure).toBe(false);
  });

  it('flags partialFailure and bounds fan-out concurrency when upstream aggregate calls fail', async () => {
    const validAgg = makeAggregate('agg-1', 'Javelin-4', 18, 9, 0, 'snap-a');

    vi.mocked(getUserSessions)
      .mockResolvedValueOnce({
        data: Array.from({ length: 12 }, (_, idx) => ({ id: `sess-${idx}` })),
        error: undefined,
      } as any)
      .mockResolvedValueOnce({
        data: undefined,
        error: { message: 'timeout' },
      } as any);

    vi.mocked(getSnapshots).mockResolvedValueOnce({
      data: {
        items: [{ id: 'snap-a', name: 'Prismatic HC' }],
      },
      error: undefined,
    } as any);

    let activeInFlight = 0;
    let peakInFlight = 0;

    vi.mocked(getSessionAggregates).mockImplementation(async ({ path }) => {
      activeInFlight += 1;
      peakInFlight = Math.max(peakInFlight, activeInFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      activeInFlight -= 1;
      if (path.sessionId === 'sess-0') {
        return {
          data: { aggregates: [validAgg], snapshots: {} },
          error: undefined,
        } as any;
      }
      if (path.sessionId === 'sess-1') {
        return { data: undefined, error: { message: '502' } } as any;
      }
      return {
        data: { aggregates: [], snapshots: {} },
        error: undefined,
      } as any;
    });

    vi.mocked(getSnapshotAggregates).mockResolvedValueOnce({
      data: undefined,
      error: { message: 'timeout' },
    } as any);

    const res = await loader({
      params: { id: 'user-1', characterId: 'char-1' },
      context: new Map(),
      request: new Request('http://localhost/profile/user-1/c/char-1/metrics'),
    } as any);

    expect(peakInFlight).toBeLessThanOrEqual(8);
    expect(res.partialFailure).toBe(true);
    expect(res.error).toBeUndefined();
    expect(res.aggregates).toHaveLength(1);
  });

  it('renders CharacterMetrics trend panel, all-loadout map telemetry, and best loadout links', () => {
    const aggregates = [
      makeAggregate('agg-1', 'Javelin-4', 18, 9, 0, 'snap-a'),
      makeAggregate('agg-2', 'Javelin-4', 16, 8, 0, 'snap-a'),
      makeAggregate('agg-3', 'Cirrus Plaza', 6, 14, 1, 'snap-b'),
      makeAggregate('agg-4', 'Cirrus Plaza', 7, 13, 1, 'snap-b'),
    ];

    render(
      <MemoryRouter>
        <CharacterMetrics
          loaderData={{
            aggregates,
            snapshots: {
              'snap-a': { id: 'snap-a', name: 'Prismatic HC' },
              'snap-b': { id: 'snap-b', name: 'Void SMG' },
            },
            partialFailure: true,
            error: undefined,
          }}
          params={{ id: 'user-1', characterId: 'char-1' }}
          matches={[] as any}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Hunter Metrics' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Some recent sessions or loadouts timed out/i),
    ).toBeInTheDocument();
    expect(screen.getByText('All-Loadout Map Telemetry')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /Prismatic HC/i }).length,
    ).toBeGreaterThan(0);
  });

  it('renders empty state when no aggregates are recorded yet', () => {
    render(
      <MemoryRouter>
        <CharacterMetrics
          loaderData={{
            aggregates: [],
            snapshots: {},
            partialFailure: false,
            error: undefined,
          }}
          params={{ id: 'user-1', characterId: 'char-1' }}
          matches={[] as any}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('No Metrics Recorded Yet')).toBeInTheDocument();
  });
});
