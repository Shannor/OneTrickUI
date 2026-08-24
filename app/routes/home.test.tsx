import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import Home from './home';

vi.mock('~/hooks/use-route-loaders', () => ({
  useProfileData: () => ({
    type: 'owner',
    profile: {
      id: 'user-1',
      displayName: 'TestGuardian',
      characters: [{ id: 'char-1', class: 'Hunter' }],
    },
    character: { id: 'char-1', class: 'Hunter' },
  }),
}));

describe('Home Page Route Component', () => {
  it('renders recent sessions and empty loadouts state when loadouts is empty', () => {
    const mockSession = {
      id: 'session-1',
      name: 'Trials Run 1',
      userId: 'user-1',
      characterId: 'char-1',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      aggregateIds: ['agg-1', 'agg-2'],
      status: 'complete' as const,
    };

    const props = {
      loaderData: {
        sessions: [mockSession],
        loadouts: { items: [], count: {}, stats: {} },
        error: undefined,
      },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText(/welcome testguardian/i)).toBeInTheDocument();
    expect(screen.getByText('Recent Sessions')).toBeInTheDocument();
    expect(screen.getByText('Trials Run 1')).toBeInTheDocument();
    expect(screen.getByText('No Top Loadouts Found')).toBeInTheDocument();
  });

  it('renders empty sessions state when sessions list is empty', () => {
    const props = {
      loaderData: {
        sessions: [],
        loadouts: { items: [], count: {}, stats: {} },
        error: undefined,
      },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('No Sessions Recorded')).toBeInTheDocument();
    expect(screen.getByText('No Top Loadouts Found')).toBeInTheDocument();
  });
});
