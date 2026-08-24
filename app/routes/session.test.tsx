import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '~/components/ui/tooltip';

import Session from './session';

vi.mock('~/hooks/use-route-loaders', () => ({
  useProfileData: () => ({
    type: 'owner',
    profile: { id: 'user-1', displayName: 'Guardian' },
  }),
}));

vi.mock('@firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
}));

describe('Session Page Route Component', () => {
  it('renders active recording banner with 2 hour auto-end notice when session status is pending', () => {
    const props = {
      loaderData: {
        session: {
          id: 'session-123',
          name: 'Active Trial Session',
          status: 'pending' as const,
          startedAt: new Date().toISOString(),
          aggregateIds: [],
        },
        aggregates: [],
        snapshots: {},
        error: undefined,
        path: 'http://localhost/test',
      },
      params: { characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Session>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Session {...props} />,
      },
    ]);

    render(
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>,
    );

    expect(screen.getByText('Session Active & Recording')).toBeInTheDocument();
    expect(
      screen.getByText(/start playing destiny 2 matches/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/after 2 hours of inactivity/i),
    ).toBeInTheDocument();
  });

  it('hides active recording banner when 3 or more games have been recorded', () => {
    const props = {
      loaderData: {
        session: {
          id: 'session-123',
          name: 'Active Trial Session',
          status: 'pending' as const,
          startedAt: new Date().toISOString(),
          aggregateIds: ['game-1', 'game-2', 'game-3'],
        },
        aggregates: [],
        snapshots: {},
        error: undefined,
        path: 'http://localhost/test',
      },
      params: { characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Session>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Session {...props} />,
      },
    ]);

    render(
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>,
    );

    expect(
      screen.queryByText('Session Active & Recording'),
    ).not.toBeInTheDocument();
  });
});
