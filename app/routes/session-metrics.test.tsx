import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Aggregate, CharacterSnapshot } from '~/api';

import { SessionMetrics } from './session-metrics';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;
}

const mockUseSessionData = vi.fn();
const mockUseOptionalProfileData = vi.fn();

vi.mock('~/hooks/use-route-loaders', () => ({
  useSessionData: () => mockUseSessionData(),
  useOptionalProfileData: () => mockUseOptionalProfileData(),
}));

describe('SessionMetrics route component', () => {
  const mockSnapshot: CharacterSnapshot = {
    id: 'snap-1',
    name: 'Trials Solar Hunter',
    userId: 'user-1',
    characterId: 'char-1',
    hash: 'hash-1',
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-01T10:00:00Z'),
    loadout: {},
  };

  const mockAggregates: Aggregate[] = [
    {
      id: 'agg-1',
      activityId: 'act-1',
      sessionIds: ['sess-1'],
      characterIds: ['char-1'],
      snapshotIds: ['snap-1'],
      createdAt: new Date('2026-10-01T11:00:00Z'),
      activityDetails: {
        instanceId: 'inst-1',
        activity: 'Trials of Osiris',
        location: 'Endless Vale',
        period: new Date('2026-10-01T11:00:00Z'),
        imageUrl: '/vale.png',
        activityIcon: '/trials.png',
      } as any,
      snapshotLinks: {
        'char-1': {
          characterId: 'char-1',
          snapshotId: 'snap-1',
          confidenceLevel: 'high',
          confidenceSource: 'system',
          createdAt: new Date('2026-10-01T11:00:00Z'),
        },
      },
      performance: {
        'char-1': {
          playerStats: {
            kills: { value: 16 },
            deaths: { value: 7 },
            assists: { value: 4 },
            standing: { value: 0 },
          },
          weapons: {},
        } as any,
      },
    },
    {
      id: 'agg-2',
      activityId: 'act-2',
      sessionIds: ['sess-1'],
      characterIds: ['char-1'],
      snapshotIds: ['snap-1'],
      createdAt: new Date('2026-10-01T11:15:00Z'),
      activityDetails: {
        instanceId: 'inst-2',
        activity: 'Trials of Osiris',
        location: 'Endless Vale',
        period: new Date('2026-10-01T11:15:00Z'),
        imageUrl: '/vale.png',
        activityIcon: '/trials.png',
      } as any,
      snapshotLinks: {
        'char-1': {
          characterId: 'char-1',
          snapshotId: 'snap-1',
          confidenceLevel: 'high',
          confidenceSource: 'system',
          createdAt: new Date('2026-10-01T11:00:00Z'),
        },
      },
      performance: {
        'char-1': {
          playerStats: {
            kills: { value: 14 },
            deaths: { value: 6 },
            assists: { value: 3 },
            standing: { value: 0 },
          },
          weapons: {},
        } as any,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOptionalProfileData.mockReturnValue({
      profile: { id: 'user-1', displayName: 'Zone 6 Weegee' },
    });
  });

  it('renders overall Session Map Telemetry with top build and per-loadout MapTelemetryPanel', () => {
    mockUseSessionData.mockReturnValue({
      session: { id: 'sess-1', name: 'Flawless Card' },
      aggregates: mockAggregates,
      snapshots: { 'snap-1': mockSnapshot },
      path: 'https://d2onetrick.com/profile/user-1/c/char-1/sessions/sess-1',
    });

    render(
      <MemoryRouter>
        <SessionMetrics
          params={{ id: 'user-1', characterId: 'char-1', sessionId: 'sess-1' }}
          loaderData={undefined as any}
          matches={[] as any}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Session Metrics')).toBeInTheDocument();
    expect(screen.getByText('Session Map Telemetry')).toBeInTheDocument();
    expect(screen.getByText('Loadout Map Telemetry')).toBeInTheDocument();
    expect(screen.getAllByText('Endless Vale').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Trials Solar Hunter').length).toBeGreaterThan(
      0,
    );
  });

  it('renders Empty state when session has no aggregates', () => {
    mockUseSessionData.mockReturnValue({
      session: { id: 'sess-1', name: 'Empty Session' },
      aggregates: [],
      snapshots: {},
      path: 'https://d2onetrick.com/profile/user-1/c/char-1/sessions/sess-1',
    });

    render(
      <MemoryRouter>
        <SessionMetrics
          params={{ id: 'user-1', characterId: 'char-1', sessionId: 'sess-1' }}
          loaderData={undefined as any}
          matches={[] as any}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Get in the Crucible!')).toBeInTheDocument();
  });

  it('filters metrics and map telemetry using AND semantics across selected teammates', () => {
    const makeAgg = (
      id: string,
      location: string,
      kills: number,
      deaths: number,
      withTragic: boolean,
      withNova: boolean,
    ): Aggregate => ({
      id,
      activityId: `act-${id}`,
      sessionIds: ['sess-1'],
      characterIds: ['char-1'],
      snapshotIds: ['snap-1'],
      createdAt: new Date('2026-10-01T11:00:00Z'),
      activityDetails: {
        instanceId: `inst-${id}`,
        activity: 'Trials of Osiris',
        location,
        period: new Date('2026-10-01T11:00:00Z'),
        imageUrl: '/map.png',
        activityIcon: '/trials.png',
        isPrivate: false,
      } as any,
      snapshotLinks: {
        'char-1': {
          characterId: 'char-1',
          snapshotId: 'snap-1',
          confidenceLevel: 'high',
          confidenceSource: 'system',
          createdAt: new Date('2026-10-01T11:00:00Z'),
        },
        ...(withTragic
          ? {
              'char-tragic': {
                characterId: 'char-tragic',
                sessionId: 'sess-tragic',
                confidenceLevel: 'high',
                confidenceSource: 'system',
                createdAt: new Date('2026-10-01T11:00:00Z'),
              },
            }
          : {}),
        ...(withNova
          ? {
              'char-nova': {
                characterId: 'char-nova',
                sessionId: 'sess-nova',
                confidenceLevel: 'high',
                confidenceSource: 'system',
                createdAt: new Date('2026-10-01T11:00:00Z'),
              },
            }
          : {}),
      },
      performance: {
        'char-1': {
          playerStats: {
            kills: { value: kills },
            deaths: { value: deaths },
            assists: { value: 2 },
            standing: { value: 0 },
            fireTeamId: { value: 777 },
          },
          weapons: {},
        } as any,
        ...(withTragic
          ? {
              'char-tragic': {
                playerStats: {
                  standing: { value: 0 },
                  fireTeamId: { value: 777 },
                },
                weapons: {},
              } as any,
            }
          : {}),
        ...(withNova
          ? {
              'char-nova': {
                playerStats: {
                  standing: { value: 0 },
                  fireTeamId: { value: 777 },
                },
                weapons: {},
              } as any,
            }
          : {}),
      },
    });

    mockUseSessionData.mockReturnValue({
      session: {
        id: 'sess-1',
        userId: 'user-1',
        characterId: 'char-1',
        name: 'Trio Card',
        summary: {
          totalMatches: 3,
          companions: [
            {
              userId: 'user-tragic',
              displayName: 'Tragic',
              sharedMatches: 2,
              wins: 2,
              losses: 0,
              sessions: [
                {
                  sessionId: 'sess-tragic',
                  characterId: 'char-tragic',
                  class: 'Titan',
                  sharedMatches: 2,
                },
              ],
            },
            {
              userId: 'user-nova',
              displayName: 'Nova',
              sharedMatches: 2,
              wins: 2,
              losses: 0,
              sessions: [
                {
                  sessionId: 'sess-nova',
                  characterId: 'char-nova',
                  class: 'Warlock',
                  sharedMatches: 2,
                },
              ],
            },
          ],
        },
      },
      aggregates: [
        makeAgg('1', 'Javelin-4', 20, 5, true, true),
        makeAgg('2', 'Burnout', 10, 10, true, false),
        makeAgg('3', 'Cauldron', 5, 10, false, true),
      ],
      participants: {
        'char-tragic': {
          userId: 'user-tragic',
          displayName: 'Tragic',
          characterId: 'char-tragic',
          class: 'Titan',
        },
        'char-nova': {
          userId: 'user-nova',
          displayName: 'Nova',
          characterId: 'char-nova',
          class: 'Warlock',
        },
      },
      snapshots: { 'snap-1': mockSnapshot },
      path: 'https://d2onetrick.com/profile/user-1/c/char-1/sessions/sess-1',
    });

    render(
      <MemoryRouter
        initialEntries={[
          '/profile/user-1/c/char-1/sessions/sess-1/metrics?teammate=user-tragic&teammate=user-nova',
        ]}
      >
        <SessionMetrics
          params={{ id: 'user-1', characterId: 'char-1', sessionId: 'sess-1' }}
          loaderData={undefined as any}
          matches={[] as any}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/stats for 1 match with tragic & nova/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Javelin-4').length).toBeGreaterThan(0);
    expect(screen.queryByText('Burnout')).not.toBeInTheDocument();
    expect(screen.queryByText('Cauldron')).not.toBeInTheDocument();
    expect(screen.getAllByText('4.00').length).toBeGreaterThan(0);
  });

  it('renders an empty state and clear action when no matches contain all selected teammates', () => {
    mockUseSessionData.mockReturnValue({
      session: {
        id: 'sess-1',
        userId: 'user-1',
        characterId: 'char-1',
        name: 'Split Card',
        summary: {
          totalMatches: 2,
          companions: [
            {
              userId: 'user-tragic',
              displayName: 'Tragic',
              sharedMatches: 1,
              wins: 1,
              losses: 0,
              sessions: [
                {
                  sessionId: 'sess-tragic',
                  characterId: 'char-tragic',
                  sharedMatches: 1,
                },
              ],
            },
            {
              userId: 'user-nova',
              displayName: 'Nova',
              sharedMatches: 1,
              wins: 1,
              losses: 0,
              sessions: [
                {
                  sessionId: 'sess-nova',
                  characterId: 'char-nova',
                  sharedMatches: 1,
                },
              ],
            },
          ],
        },
      },
      aggregates: mockAggregates,
      participants: {
        'char-tragic': {
          userId: 'user-tragic',
          displayName: 'Tragic',
          characterId: 'char-tragic',
        },
        'char-nova': {
          userId: 'user-nova',
          displayName: 'Nova',
          characterId: 'char-nova',
        },
      },
      snapshots: { 'snap-1': mockSnapshot },
      path: 'https://d2onetrick.com/profile/user-1/c/char-1/sessions/sess-1',
    });

    render(
      <MemoryRouter
        initialEntries={[
          '/profile/user-1/c/char-1/sessions/sess-1/metrics?teammate=user-tragic&teammate=user-nova',
        ]}
      >
        <SessionMetrics
          params={{ id: 'user-1', characterId: 'char-1', sessionId: 'sess-1' }}
          loaderData={undefined as any}
          matches={[] as any}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('No Matches Found with Tragic & Nova'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show all matches/i }));

    expect(screen.getByText('Session Metrics')).toBeInTheDocument();
  });
});
