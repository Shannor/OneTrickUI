import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type TelemetryMatch, getCharacterTelemetry } from '~/api';

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
    getCharacterTelemetry: vi.fn(),
  };
});

function makeTelemetryMatch(
  id: string,
  location: string,
  kills: number,
  deaths: number,
  won: boolean,
): TelemetryMatch {
  return {
    activityId: `act-${id}`,
    period: new Date(`2026-10-0${id.slice(-1)}T12:00:00Z`),
    location,
    activity: 'Control',
    estimatedGameMode: 'quickplay',
    kills,
    deaths,
    assists: 5,
    won,
    snapshotId: 'snap-1',
    snapshotConfidence: 'high',
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

  it('loads loadout telemetry via getCharacterTelemetry scoped by snapshotId', async () => {
    const matches = [makeTelemetryMatch('1', 'Javelin-4', 20, 10, true)];
    vi.mocked(getCharacterTelemetry).mockResolvedValueOnce({
      data: {
        matches,
        snapshots: { 'snap-1': { id: 'snap-1', name: 'Ace + Matador' } },
        totalCount: 1,
        truncated: false,
      },
      error: undefined,
    } as any);

    const res = await loader({
      params: { id: 'user-1', characterId: 'char-1', snapshotId: 'snap-1' },
      context: new Map(),
      request: new Request(
        'http://localhost/profile/user-1/c/char-1/loadouts/snap-1/metrics',
      ),
    } as any);

    expect(getCharacterTelemetry).toHaveBeenCalledTimes(1);
    expect(getCharacterTelemetry).toHaveBeenCalledWith({
      path: { userId: 'user-1', characterId: 'char-1' },
      query: { snapshotId: 'snap-1' },
    });
    expect(res.error).toBeUndefined();
    expect(res.matches).toHaveLength(1);
    expect(res.totalCount).toBe(1);
    expect(res.truncated).toBe(false);
  });

  it('returns error state when getCharacterTelemetry fails', async () => {
    vi.mocked(getCharacterTelemetry).mockResolvedValueOnce({
      data: undefined,
      error: { message: 'Not Found' },
    } as any);

    const res = await loader({
      params: { id: 'user-1', characterId: 'char-1', snapshotId: 'snap-1' },
      context: new Map(),
      request: new Request(
        'http://localhost/profile/user-1/c/char-1/loadouts/snap-1/metrics',
      ),
    } as any);

    expect(res.error).toBe('Failed to load loadout metrics');
    expect(res.matches).toEqual([]);
  });

  it('returns error state when getCharacterTelemetry rejects with a network error', async () => {
    vi.mocked(getCharacterTelemetry).mockRejectedValueOnce(
      new Error('fetch failed'),
    );

    const res = await loader({
      params: { id: 'user-1', characterId: 'char-1', snapshotId: 'snap-1' },
      context: new Map(),
      request: new Request(
        'http://localhost/profile/user-1/c/char-1/loadouts/snap-1/metrics',
      ),
    } as any);

    expect(res.error).toBe('Failed to load loadout metrics');
    expect(res.matches).toEqual([]);
    expect(res.totalCount).toBe(0);
    expect(res.truncated).toBe(false);
  });

  it('renders MetricsTrendPanel, MapTelemetryPanel, and optional truncation notice when matches exist', () => {
    const matches = [
      makeTelemetryMatch('1', 'Javelin-4', 22, 10, true),
      makeTelemetryMatch('2', 'Javelin-4', 18, 9, true),
      makeTelemetryMatch('3', 'Meltdown', 8, 15, false),
      makeTelemetryMatch('4', 'Meltdown', 7, 14, false),
    ];

    render(
      <MemoryRouter>
        <LoadoutMetrics
          loaderData={{
            matches,
            totalCount: 520,
            truncated: true,
            error: undefined,
          }}
          params={{ id: 'user-1', characterId: 'char-1', snapshotId: 'snap-1' }}
          matches={[] as any}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Showing most recent 4 of 520 tracked matches.',
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

  it('renders Empty state when matches are empty', () => {
    render(
      <MemoryRouter>
        <LoadoutMetrics
          loaderData={{
            matches: [],
            totalCount: 0,
            truncated: false,
            error: undefined,
          }}
          params={{ id: 'user-1', characterId: 'char-1', snapshotId: 'snap-1' }}
          matches={[] as any}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('No Metrics Recorded Yet')).toBeInTheDocument();
  });
});
