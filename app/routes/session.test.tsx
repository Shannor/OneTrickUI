import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('~/lib/firebaseConfig', () => ({
  getFirestoreDb: vi.fn().mockResolvedValue({ __mockDb: true }),
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

  it('subscribes to Firestore onSnapshot when session status is pending', async () => {
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

    await waitFor(() => {
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
  });

  it('does not subscribe to Firestore onSnapshot when session status is complete', async () => {
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

    await Promise.resolve();
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('keeps Firestore onSnapshot active for a completed session while compTracking.end is finalizing', async () => {
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
          id: 'session-comp-finalizing',
          name: 'Comp Run',
          status: 'complete' as const,
          startedAt: new Date().toISOString(),
          aggregateIds: ['game-1'],
          compTracking: {
            enabled: true,
            start: {
              divisionName: 'Platinum III',
              points: 5820,
              stepIndex: 21,
            },
          },
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

    await waitFor(() => {
      expect(onSnapshot).toHaveBeenCalledTimes(1);
      expect(snapshotCallback).toBeDefined();
    });

    snapshotCallback!({
      data: () => ({
        id: 'session-comp-finalizing',
        status: 'complete',
        aggregateIds: ['game-1'],
        compTracking: {
          enabled: true,
          start: { divisionName: 'Platinum III', points: 5820, stepIndex: 21 },
          end: { divisionName: 'Platinum II', points: 6045, stepIndex: 22 },
          pointDelta: 225,
        },
      }),
    });

    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it('revalidates when Firestore sends a subsequent real-time update', async () => {
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

    await waitFor(() => {
      expect(snapshotCallback).toBeDefined();
    });

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

  it('revalidates on initial snapshot if Firestore data is already ahead of loaderData', async () => {
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

    await waitFor(() => {
      expect(snapshotCallback).toBeDefined();
    });

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

  it('handles Firestore onSnapshot error gracefully without throwing', async () => {
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

    await waitFor(() => {
      expect(errorCallback).toBeDefined();
    });
    expect(() => {
      errorCallback!(new Error('Connection lost'));
    }).not.toThrow();
  });

  it('does not render a parent <title> when session is loaded so child route <title> in <Outlet /> is the first title in document.head', () => {
    const props = {
      loaderData: {
        session: {
          id: 'session-done',
          name: 'Weekend Trials',
          status: 'complete' as const,
          startedAt: new Date().toISOString(),
          aggregateIds: ['game-1'],
        },
        aggregates: [],
        snapshots: {},
        error: undefined,
        path: 'https://d2onetrick.com/profile/user-1/c/char-1/sessions/session-done',
      },
      params: { characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Session>;

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <Session {...props} />,
          children: [
            {
              path: 'metrics',
              element: (
                <div>
                  <title>Weekend Trials - Guardian Metrics | 1 Trick</title>
                </div>
              ),
            },
          ],
        },
      ],
      { initialEntries: ['/metrics'] },
    );

    render(
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>,
    );

    const titles = Array.from(document.head.querySelectorAll('title')).map(
      (el) => el.textContent,
    );
    expect(titles).toEqual(['Weekend Trials - Guardian Metrics | 1 Trick']);
    expect(document.title).toBe('Weekend Trials - Guardian Metrics | 1 Trick');
  });
});
