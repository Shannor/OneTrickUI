import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { doc, onSnapshot } from 'firebase/firestore';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '~/components/ui/tooltip';

import Session from './session';

const mockRevalidate = vi.fn().mockResolvedValue(undefined);

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useRevalidator: () => ({
      revalidate: mockRevalidate,
      state: 'idle',
    }),
  };
});

vi.mock('~/hooks/use-route-loaders', () => ({
  useProfileData: () => ({
    type: 'owner',
    profile: { id: 'user-1', displayName: 'Guardian' },
  }),
}));

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    doc: vi.fn((_db, collection, id) => ({ collection, id })),
    onSnapshot: vi.fn(() => vi.fn()),
  };
});

describe('Session Page Route Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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

  it('subscribes to Firestore onSnapshot when session status is pending', () => {
    const props = {
      loaderData: {
        session: {
          id: 'session-live',
          name: 'Pending Session',
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

    expect(doc).toHaveBeenCalledWith(
      expect.anything(),
      'sessions',
      'session-live',
    );
    expect(onSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'sessions', id: 'session-live' }),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('does not subscribe to Firestore onSnapshot when session status is complete', () => {
    const props = {
      loaderData: {
        session: {
          id: 'session-done',
          name: 'Completed Session',
          status: 'complete' as const,
          startedAt: new Date().toISOString(),
          aggregateIds: ['game-1'],
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

    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('revalidates when Firestore sends a subsequent real-time update', () => {
    let snapshotCallback:
      | ((snapshot: { data: () => unknown }) => void)
      | undefined;
    vi.mocked(onSnapshot).mockImplementationOnce((_docRef, next) => {
      snapshotCallback = next as never;
      return vi.fn();
    });

    const props = {
      loaderData: {
        session: {
          id: 'session-fresh',
          name: 'Fresh Session',
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

    expect(snapshotCallback).toBeDefined();

    // First snapshot represents initial sync with identical state
    snapshotCallback!({
      data: () => ({
        id: 'session-fresh',
        status: 'pending',
        aggregateIds: [],
      }),
    });
    expect(mockRevalidate).not.toHaveBeenCalled();

    // Subsequent snapshot represents an incoming match from Firestore
    snapshotCallback!({
      data: () => ({
        id: 'session-fresh',
        status: 'pending',
        aggregateIds: ['new-aggregate-1'],
      }),
    });
    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it('revalidates on initial snapshot if Firestore data is already ahead of loaderData', () => {
    let snapshotCallback:
      | ((snapshot: { data: () => unknown }) => void)
      | undefined;
    vi.mocked(onSnapshot).mockImplementationOnce((_docRef, next) => {
      snapshotCallback = next as never;
      return vi.fn();
    });

    const props = {
      loaderData: {
        session: {
          id: 'session-fresh',
          name: 'Fresh Session',
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

    // Initial snapshot arrives with already processed game
    snapshotCallback!({
      data: () => ({
        id: 'session-fresh',
        status: 'pending',
        aggregateIds: ['already-recorded-game'],
      }),
    });

    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it('handles Firestore onSnapshot error gracefully without throwing', () => {
    let errorCallback: ((err: unknown) => void) | undefined;
    vi.mocked(onSnapshot).mockImplementationOnce((_docRef, _next, error) => {
      errorCallback = error as never;
      return vi.fn();
    });

    const props = {
      loaderData: {
        session: {
          id: 'session-fresh',
          name: 'Fresh Session',
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

    expect(errorCallback).toBeDefined();
    expect(() => {
      errorCallback!(new Error('Connection lost'));
    }).not.toThrow();
  });
});
