import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { SessionGames } from './session-games';

const mockUseSessionData = vi.fn();

vi.mock('~/hooks/use-route-loaders', () => ({
  useSessionData: () => mockUseSessionData(),
  useOptionalProfileData: () => null,
}));

describe('SessionGames Route Component', () => {
  it('renders "Get in the Crucible!" empty state when session has no recorded games or aggregates', () => {
    mockUseSessionData.mockReturnValue({
      session: {
        id: 'session-1',
        name: 'Crucible Warmup',
        aggregateIds: [],
        status: 'pending',
      },
      aggregates: [],
      snapshots: {},
      path: 'https://d2onetrick.com/profile/user-1/c/char-1/sessions/session-1',
    });

    const props = {
      params: { characterId: 'char-1', id: 'user-1' },
    } as unknown as ComponentProps<typeof SessionGames>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <SessionGames {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Get in the Crucible!')).toBeInTheDocument();
    expect(
      screen.getByText('Play some games so we can get new information!'),
    ).toBeInTheDocument();
    expect(document.title).toBe('Crucible Warmup | 1 Trick');
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href'),
    ).toBe('https://d2onetrick.com/profile/user-1/c/char-1/sessions/session-1');
  });

  it('renders "Processing Match Data" empty state when game is recorded but aggregates are empty', () => {
    mockUseSessionData.mockReturnValue({
      session: {
        id: 'session-1',
        aggregateIds: ['game-1'],
        status: 'pending',
      },
      aggregates: [],
      snapshots: {},
    });

    const props = {
      params: { characterId: 'char-1', id: 'user-1' },
    } as unknown as ComponentProps<typeof SessionGames>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <SessionGames {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Processing Match Data')).toBeInTheDocument();
    expect(
      screen.getByText(/your game was recorded! stats and match details/i),
    ).toBeInTheDocument();
  });

  it('renders "Get in the Crucible!" when snapshots is undefined', () => {
    mockUseSessionData.mockReturnValue({
      session: {
        id: 'session-1',
        aggregateIds: ['game-1'],
        status: 'pending',
      },
      aggregates: [{ id: 'agg-1' }],
      snapshots: undefined,
    });

    const props = {
      params: { characterId: 'char-1', id: 'user-1' },
    } as unknown as ComponentProps<typeof SessionGames>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <SessionGames {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Get in the Crucible!')).toBeInTheDocument();
  });

  it('renders a 44px loadout link pill wrapping both the snapshot name and external link icon', () => {
    mockUseSessionData.mockReturnValue({
      session: {
        id: 'session-1',
        name: 'Trials Run',
        aggregateIds: ['game-1'],
        status: 'completed',
      },
      aggregates: [
        {
          id: 'agg-1',
          activityDetails: {
            instanceId: 'inst-1',
            period: '2026-11-24T20:00:00Z',
            activity: 'Trials of Osiris',
            mode: 'Trials of Osiris',
            location: 'Javelin-4',
            imageUrl: '/jav4.jpg',
            activityIcon: '/trials.png',
          },
          snapshotLinks: {
            'char-1': {
              snapshotId: 'snap-1',
              confidenceLevel: 'high',
            },
          },
          performance: {
            'char-1': {
              playerStats: {
                standing: { value: 0 },
                kills: { value: 12 },
                assists: { value: 4 },
                deaths: { value: 5 },
              },
            },
          },
        },
      ],
      snapshots: {
        'snap-1': {
          id: 'snap-1',
          name: 'Solar Ace Build',
          loadout: {},
        },
      },
    });

    const props = {
      params: { characterId: 'char-1', id: 'user-1' },
    } as unknown as ComponentProps<typeof SessionGames>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <SessionGames {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    const loadoutLink = screen.getByRole('link', { name: /solar ace build/i });
    expect(loadoutLink).toHaveAttribute(
      'href',
      '/profile/user-1/c/char-1/loadouts/snap-1',
    );
    expect(loadoutLink).toHaveClass('min-h-11');
    expect(loadoutLink.querySelector('svg')).toBeInTheDocument();
  });

  it('navigates to the session-scoped activity URL when clicking a game card', async () => {
    mockUseSessionData.mockReturnValue({
      session: {
        id: 'session-1',
        name: 'Trials Run',
        aggregateIds: ['game-1'],
        status: 'completed',
      },
      aggregates: [
        {
          id: 'agg-1',
          activityDetails: {
            instanceId: 'inst-1',
            period: '2026-11-24T20:00:00Z',
            activity: 'Trials of Osiris',
            mode: 'Trials of Osiris',
            location: 'Javelin-4',
            imageUrl: '/jav4.jpg',
            activityIcon: '/trials.png',
          },
          snapshotLinks: {
            'char-1': {
              snapshotId: 'snap-1',
              confidenceLevel: 'high',
            },
          },
          performance: {
            'char-1': {
              playerStats: {
                standing: { value: 0 },
                kills: { value: 12 },
                assists: { value: 4 },
                deaths: { value: 5 },
              },
            },
          },
        },
      ],
      snapshots: {
        'snap-1': {
          id: 'snap-1',
          name: 'Solar Ace Build',
          loadout: {},
        },
      },
    });

    const props = {
      params: { characterId: 'char-1', id: 'user-1', sessionId: 'session-1' },
    } as unknown as ComponentProps<typeof SessionGames>;

    const router = createMemoryRouter(
      [
        {
          path: '/profile/user-1/c/char-1/sessions/session-1',
          element: <SessionGames {...props} />,
        },
        {
          path: '/profile/user-1/c/char-1/sessions/session-1/activities/inst-1',
          element: <div>Activity Details Page</div>,
        },
      ],
      { initialEntries: ['/profile/user-1/c/char-1/sessions/session-1'] },
    );

    render(<RouterProvider router={router} />);

    fireEvent.click(screen.getByText('Javelin-4'));

    expect(
      await screen.findByText('Activity Details Page'),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(
      '/profile/user-1/c/char-1/sessions/session-1/activities/inst-1',
    );
  });

  it('filters a partial drop-in session (3 of 6 matches) by teammate and renders companion stats and loadout icons on shared matches only', () => {
    const makeMatch = (
      idx: number,
      location: string,
      withCompanion: boolean,
    ) => ({
      id: `agg-${idx}`,
      activityDetails: {
        instanceId: `inst-${idx}`,
        period: `2026-11-27T20:0${idx}:00Z`,
        activity: 'Trials of Osiris',
        mode: 'Trials of Osiris',
        location,
        imageUrl: `/map-${idx}.jpg`,
        activityIcon: '/trials.png',
        isPrivate: false,
      },
      snapshotLinks: {
        'char-1': {
          snapshotId: 'snap-owner',
          confidenceLevel: 'high',
        },
        ...(withCompanion
          ? {
              'char-tragic': {
                snapshotId: 'snap-tragic',
                sessionId: 'sess-tragic',
                confidenceLevel: 'high',
              },
            }
          : {}),
      },
      performance: {
        'char-1': {
          playerStats: {
            standing: { value: 0 },
            kills: { value: 10 },
            assists: { value: 3 },
            deaths: { value: 5 },
            fireTeamId: { value: 12345 },
          },
        },
        ...(withCompanion
          ? {
              'char-tragic': {
                playerStats: {
                  standing: { value: 0 },
                  kills: { value: 16 },
                  assists: { value: 4 },
                  deaths: { value: 8 },
                  fireTeamId: { value: 12345 },
                },
              },
            }
          : {}),
      },
    });

    mockUseSessionData.mockReturnValue({
      session: {
        id: 'session-1',
        userId: 'user-1',
        characterId: 'char-1',
        name: 'Drop-in Trials',
        aggregateIds: ['agg-1', 'agg-2', 'agg-3', 'agg-4', 'agg-5', 'agg-6'],
        status: 'complete',
        summary: {
          totalMatches: 6,
          companions: [
            {
              userId: 'user-tragic',
              displayName: 'Tragic',
              sharedMatches: 3,
              wins: 3,
              losses: 0,
              sessions: [
                {
                  sessionId: 'sess-tragic',
                  characterId: 'char-tragic',
                  class: 'Titan',
                  emblemUrl: '/img/tragic.jpg',
                  sharedMatches: 3,
                },
              ],
            },
          ],
        },
      },
      aggregates: [
        makeMatch(1, 'Javelin-4', true),
        makeMatch(2, 'Burnout', true),
        makeMatch(3, 'Cauldron', true),
        makeMatch(4, 'Pacifica', false),
        makeMatch(5, 'Wormhaven', false),
        makeMatch(6, 'Solitude', false),
      ],
      participants: {
        'char-tragic': {
          userId: 'user-tragic',
          displayName: 'Tragic',
          characterId: 'char-tragic',
          class: 'Titan',
          emblemUrl: '/img/tragic.jpg',
        },
      },
      snapshots: {
        'snap-owner': {
          id: 'snap-owner',
          characterId: 'char-1',
          name: 'Owner Build',
          loadout: {},
        },
        'snap-tragic': {
          id: 'snap-tragic',
          characterId: 'char-tragic',
          name: 'Tragic Titan',
          loadout: {
            3284755031: {
              itemHash: 3284755031n,
              name: 'Striker',
              details: {
                baseInfo: {
                  name: 'Striker',
                  icon: '/img/striker.png',
                },
              },
            },
            1498876634: {
              itemHash: 1111n,
              name: 'Rose',
              details: {
                baseInfo: {
                  name: 'Rose',
                  icon: '/img/rose.png',
                },
              },
            },
          },
        },
      },
    });

    const props = {
      params: { characterId: 'char-1', id: 'user-1', sessionId: 'session-1' },
    } as unknown as ComponentProps<typeof SessionGames>;

    const router = createMemoryRouter(
      [
        {
          path: '/profile/user-1/c/char-1/sessions/session-1',
          element: <SessionGames {...props} />,
        },
      ],
      {
        initialEntries: [
          '/profile/user-1/c/char-1/sessions/session-1?teammate=user-tragic',
        ],
      },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Javelin-4')).toBeInTheDocument();
    expect(screen.getByText('Burnout')).toBeInTheDocument();
    expect(screen.getByText('Cauldron')).toBeInTheDocument();
    expect(screen.queryByText('Pacifica')).not.toBeInTheDocument();
    expect(screen.queryByText('Wormhaven')).not.toBeInTheDocument();
    expect(screen.queryByText('Solitude')).not.toBeInTheDocument();

    expect(screen.getAllByAltText('Tragic emblem')).toHaveLength(3);
    expect(screen.getAllByAltText('Striker')).toHaveLength(3);
    expect(screen.getAllByAltText('Rose')).toHaveLength(3);
  });

  it('filters across multiple character sessions when a companion swapped characters mid-session', () => {
    mockUseSessionData.mockReturnValue({
      session: {
        id: 'session-1',
        userId: 'user-1',
        characterId: 'char-1',
        name: 'Swap Night',
        aggregateIds: ['agg-1', 'agg-2', 'agg-3'],
        status: 'complete',
        summary: {
          totalMatches: 3,
          companions: [
            {
              userId: 'user-swap',
              displayName: 'Swapper',
              sharedMatches: 2,
              wins: 2,
              losses: 0,
              sessions: [
                {
                  sessionId: 'sess-swap-titan',
                  characterId: 'char-swap-titan',
                  class: 'Titan',
                  sharedMatches: 1,
                },
                {
                  sessionId: 'sess-swap-warlock',
                  characterId: 'char-swap-warlock',
                  class: 'Warlock',
                  sharedMatches: 1,
                },
              ],
            },
          ],
        },
      },
      aggregates: [
        {
          id: 'agg-1',
          activityDetails: {
            instanceId: 'inst-1',
            period: '2026-11-27T20:01:00Z',
            activity: 'Control',
            mode: 'Control',
            location: 'Javelin-4',
            imageUrl: '/m1.jpg',
            activityIcon: '/c.png',
          },
          snapshotLinks: {
            'char-1': { snapshotId: 'snap-1', confidenceLevel: 'high' },
            'char-swap-titan': {
              sessionId: 'sess-swap-titan',
              confidenceLevel: 'high',
            },
          },
          performance: {
            'char-1': {
              playerStats: {
                standing: { value: 0 },
                fireTeamId: { value: 111 },
              },
            },
            'char-swap-titan': {
              playerStats: {
                standing: { value: 0 },
                kills: { value: 14 },
                deaths: { value: 7 },
                assists: { value: 2 },
                fireTeamId: { value: 111 },
              },
            },
          },
        },
        {
          id: 'agg-2',
          activityDetails: {
            instanceId: 'inst-2',
            period: '2026-11-27T20:02:00Z',
            activity: 'Control',
            mode: 'Control',
            location: 'Dead Cliffs',
            imageUrl: '/m2.jpg',
            activityIcon: '/c.png',
          },
          snapshotLinks: {
            'char-1': { snapshotId: 'snap-1', confidenceLevel: 'high' },
            'char-swap-warlock': {
              sessionId: 'sess-swap-warlock',
              confidenceLevel: 'high',
            },
          },
          performance: {
            'char-1': {
              playerStats: {
                standing: { value: 0 },
                fireTeamId: { value: 222 },
              },
            },
            'char-swap-warlock': {
              playerStats: {
                standing: { value: 0 },
                kills: { value: 15 },
                deaths: { value: 5 },
                assists: { value: 3 },
                fireTeamId: { value: 222 },
              },
            },
          },
        },
        {
          id: 'agg-3',
          activityDetails: {
            instanceId: 'inst-3',
            period: '2026-11-27T20:03:00Z',
            activity: 'Control',
            mode: 'Control',
            location: 'Midtown',
            imageUrl: '/m3.jpg',
            activityIcon: '/c.png',
          },
          snapshotLinks: {
            'char-1': { snapshotId: 'snap-1', confidenceLevel: 'high' },
          },
          performance: {
            'char-1': {
              playerStats: {
                standing: { value: 0 },
                fireTeamId: { value: 333 },
              },
            },
          },
        },
      ],
      participants: {
        'char-swap-titan': {
          userId: 'user-swap',
          displayName: 'Swapper',
          characterId: 'char-swap-titan',
          class: 'Titan',
        },
        'char-swap-warlock': {
          userId: 'user-swap',
          displayName: 'Swapper',
          characterId: 'char-swap-warlock',
          class: 'Warlock',
        },
      },
      snapshots: {
        'snap-1': {
          id: 'snap-1',
          characterId: 'char-1',
          name: 'Owner Build',
          loadout: {},
        },
      },
    });

    const props = {
      params: { characterId: 'char-1', id: 'user-1', sessionId: 'session-1' },
    } as unknown as ComponentProps<typeof SessionGames>;

    const router = createMemoryRouter(
      [
        {
          path: '/profile/user-1/c/char-1/sessions/session-1',
          element: <SessionGames {...props} />,
        },
      ],
      {
        initialEntries: [
          '/profile/user-1/c/char-1/sessions/session-1?teammate=user-swap',
        ],
      },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Javelin-4')).toBeInTheDocument();
    expect(screen.getByText('Dead Cliffs')).toBeInTheDocument();
    expect(screen.queryByText('Midtown')).not.toBeInTheDocument();
    expect(screen.getByText('Titan')).toBeInTheDocument();
    expect(screen.getByText('Warlock')).toBeInTheDocument();
  });

  it('applies AND semantics when multiple teammates are selected and clears cleanly on empty intersection', () => {
    const makeMatch = (
      idx: number,
      location: string,
      withTragic: boolean,
      withNova: boolean,
    ) => ({
      id: `agg-${idx}`,
      activityDetails: {
        instanceId: `inst-${idx}`,
        period: `2026-11-27T20:0${idx}:00Z`,
        activity: 'Trials of Osiris',
        mode: 'Trials of Osiris',
        location,
        imageUrl: `/map-${idx}.jpg`,
        activityIcon: '/trials.png',
        isPrivate: false,
      },
      snapshotLinks: {
        'char-1': { snapshotId: 'snap-owner', confidenceLevel: 'high' },
        ...(withTragic
          ? {
              'char-tragic': {
                sessionId: 'sess-tragic',
                confidenceLevel: 'high',
              },
            }
          : {}),
        ...(withNova
          ? {
              'char-nova': {
                sessionId: 'sess-nova',
                confidenceLevel: 'high',
              },
            }
          : {}),
      },
      performance: {
        'char-1': {
          playerStats: {
            standing: { value: 0 },
            kills: { value: 10 },
            deaths: { value: 5 },
            assists: { value: 2 },
            fireTeamId: { value: 500 + idx },
          },
        },
        ...(withTragic
          ? {
              'char-tragic': {
                playerStats: {
                  standing: { value: 0 },
                  kills: { value: 12 },
                  deaths: { value: 4 },
                  assists: { value: 3 },
                  fireTeamId: { value: 500 + idx },
                },
              },
            }
          : {}),
        ...(withNova
          ? {
              'char-nova': {
                playerStats: {
                  standing: { value: 0 },
                  kills: { value: 8 },
                  deaths: { value: 6 },
                  assists: { value: 5 },
                  fireTeamId: { value: 500 + idx },
                },
              },
            }
          : {}),
      },
    });

    const baseSessionData = {
      session: {
        id: 'session-1',
        userId: 'user-1',
        characterId: 'char-1',
        name: 'Trio Card',
        aggregateIds: ['agg-1', 'agg-2', 'agg-3'],
        status: 'complete',
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
      snapshots: {
        'snap-owner': {
          id: 'snap-owner',
          characterId: 'char-1',
          name: 'Owner Build',
          loadout: {},
        },
      },
    };

    mockUseSessionData.mockReturnValue({
      ...baseSessionData,
      aggregates: [
        makeMatch(1, 'Javelin-4', true, true),
        makeMatch(2, 'Burnout', true, false),
        makeMatch(3, 'Cauldron', false, true),
      ],
    });

    const props = {
      params: { characterId: 'char-1', id: 'user-1', sessionId: 'session-1' },
    } as unknown as ComponentProps<typeof SessionGames>;

    const overlapRouter = createMemoryRouter(
      [
        {
          path: '/profile/user-1/c/char-1/sessions/session-1',
          element: <SessionGames {...props} />,
        },
      ],
      {
        initialEntries: [
          '/profile/user-1/c/char-1/sessions/session-1?teammate=user-tragic&teammate=user-nova',
        ],
      },
    );

    const { unmount } = render(<RouterProvider router={overlapRouter} />);
    expect(screen.getByText('Javelin-4')).toBeInTheDocument();
    expect(screen.queryByText('Burnout')).not.toBeInTheDocument();
    expect(screen.queryByText('Cauldron')).not.toBeInTheDocument();
    unmount();

    mockUseSessionData.mockReturnValue({
      ...baseSessionData,
      aggregates: [
        makeMatch(2, 'Burnout', true, false),
        makeMatch(3, 'Cauldron', false, true),
      ],
    });

    const disjointRouter = createMemoryRouter(
      [
        {
          path: '/profile/user-1/c/char-1/sessions/session-1',
          element: <SessionGames {...props} />,
        },
      ],
      {
        initialEntries: [
          '/profile/user-1/c/char-1/sessions/session-1?teammate=user-tragic&teammate=user-nova',
        ],
      },
    );

    render(<RouterProvider router={disjointRouter} />);

    expect(
      screen.getByText('No Matches Found with Tragic & Nova'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show all matches/i }));

    expect(screen.getByText('Burnout')).toBeInTheDocument();
    expect(screen.getByText('Cauldron')).toBeInTheDocument();
  });
});
