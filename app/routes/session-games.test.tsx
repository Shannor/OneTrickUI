import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { SessionGames } from './session-games';

const mockUseSessionData = vi.fn();

vi.mock('~/hooks/use-route-loaders', () => ({
  useSessionData: () => mockUseSessionData(),
}));

describe('SessionGames Route Component', () => {
  it('renders "Get in the Crucible!" empty state when session has no recorded games or aggregates', () => {
    mockUseSessionData.mockReturnValue({
      session: {
        id: 'session-1',
        aggregateIds: [],
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

    expect(screen.getByText('Get in the Crucible!')).toBeInTheDocument();
    expect(
      screen.getByText('Play some games so we can get new information!'),
    ).toBeInTheDocument();
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
});
