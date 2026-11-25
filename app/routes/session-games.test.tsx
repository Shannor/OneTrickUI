import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
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
});
