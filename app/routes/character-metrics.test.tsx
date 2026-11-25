import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type GameMode,
  type TelemetryMatch,
  getCharacterTelemetry,
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
    getCharacterTelemetry: vi.fn(),
  };
});

function makeTelemetryMatch(
  id: string,
  location: string,
  kills: number,
  deaths: number,
  won: boolean,
  options?: {
    snapshotId?: string;
    estimatedGameMode?: GameMode;
  },
): TelemetryMatch {
  return {
    activityId: `act-${id}`,
    period: new Date(`2026-10-0${id.slice(-1)}T12:00:00Z`),
    location,
    activity: 'Trials of Osiris',
    estimatedGameMode: options?.estimatedGameMode ?? 'trials',
    kills,
    deaths,
    assists: 4,
    won,
    snapshotId: options?.snapshotId,
    snapshotConfidence: options?.snapshotId ? 'high' : undefined,
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

  it('fetches character telemetry in a single request and returns matches, snapshots, totalCount, and truncated', async () => {
    const matches = [
      makeTelemetryMatch('1', 'Javelin-4', 18, 9, true, {
        snapshotId: 'snap-a',
      }),
      makeTelemetryMatch('2', 'Burnout', 16, 10, true),
    ];

    vi.mocked(getCharacterTelemetry).mockResolvedValueOnce({
      data: {
        matches,
        snapshots: {
          'snap-a': { id: 'snap-a', name: 'Prismatic Hand Cannon' },
        },
        totalCount: 614,
        truncated: true,
      },
      error: undefined,
    } as any);

    const res = await loader({
      params: { id: 'user-1', characterId: 'char-1' },
      context: new Map(),
      request: new Request('http://localhost/profile/user-1/c/char-1/metrics'),
    } as any);

    expect(getCharacterTelemetry).toHaveBeenCalledTimes(1);
    expect(getCharacterTelemetry).toHaveBeenCalledWith({
      path: { userId: 'user-1', characterId: 'char-1' },
    });
    expect(res.error).toBeUndefined();
    expect(res.matches).toHaveLength(2);
    expect(res.snapshots['snap-a']?.name).toBe('Prismatic Hand Cannon');
    expect(res.totalCount).toBe(614);
    expect(res.truncated).toBe(true);
  });

  it('returns error state when getCharacterTelemetry fails', async () => {
    vi.mocked(getCharacterTelemetry).mockResolvedValueOnce({
      data: undefined,
      error: { message: 'Internal Server Error' },
    } as any);

    const res = await loader({
      params: { id: 'user-1', characterId: 'char-1' },
      context: new Map(),
      request: new Request('http://localhost/profile/user-1/c/char-1/metrics'),
    } as any);

    expect(res.error).toBe('Failed to load character metrics');
    expect(res.matches).toEqual([]);
    expect(res.totalCount).toBe(0);
    expect(res.truncated).toBe(false);
  });

  it('renders CharacterMetrics trend panel, all-loadout map telemetry, unmatched matches, and truncation notice', () => {
    const matches = [
      makeTelemetryMatch('1', 'Javelin-4', 18, 9, true, {
        snapshotId: 'snap-a',
      }),
      makeTelemetryMatch('2', 'Javelin-4', 16, 8, true, {
        snapshotId: 'snap-a',
      }),
      makeTelemetryMatch('3', 'Cirrus Plaza', 6, 14, false, {
        snapshotId: 'snap-b',
      }),
      makeTelemetryMatch('4', 'Cirrus Plaza', 7, 13, false),
    ];

    render(
      <MemoryRouter>
        <CharacterMetrics
          loaderData={{
            matches,
            snapshots: {
              'snap-a': { id: 'snap-a', name: 'Prismatic HC' },
              'snap-b': { id: 'snap-b', name: 'Void SMG' },
            },
            totalCount: 614,
            truncated: true,
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
    expect(screen.getByRole('status')).toHaveTextContent(
      'Showing most recent 4 of 614 tracked matches.',
    );
    expect(screen.getByText('All-Loadout Map Telemetry')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /Prismatic HC/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Cirrus Plaza').length).toBeGreaterThan(0);
  });

  it('omits truncation notice when history is not truncated and filters client-side by estimatedGameMode', () => {
    const matches = [
      makeTelemetryMatch('1', 'Javelin-4', 18, 9, true, {
        snapshotId: 'snap-a',
        estimatedGameMode: 'trials',
      }),
      makeTelemetryMatch('2', 'Midtown', 20, 10, true, {
        snapshotId: 'snap-a',
        estimatedGameMode: 'quickplay',
      }),
    ];

    render(
      <MemoryRouter>
        <CharacterMetrics
          loaderData={{
            matches,
            snapshots: {
              'snap-a': { id: 'snap-a', name: 'Prismatic HC' },
            },
            totalCount: 2,
            truncated: false,
            error: undefined,
          }}
          params={{ id: 'user-1', characterId: 'char-1' }}
          matches={[] as any}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getAllByText('Javelin-4').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Midtown').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /^Trials$/i }));

    expect(screen.getAllByText('Javelin-4').length).toBeGreaterThan(0);
    expect(screen.queryByText('Midtown')).not.toBeInTheDocument();
  });

  it('renders empty state when no matches are recorded yet', () => {
    render(
      <MemoryRouter>
        <CharacterMetrics
          loaderData={{
            matches: [],
            snapshots: {},
            totalCount: 0,
            truncated: false,
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
