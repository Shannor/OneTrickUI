import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { type ComponentProps, useState } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '~/components/ui/tooltip';
import {
  type DocumentSubscriptionCallbacks,
  subscribeToDocument,
} from '~/lib/firebaseConfig';

import Session, { SESSION_SNAPSHOT_REVALIDATE_DEBOUNCE_MS } from './session';

const mockRevalidate = vi.fn().mockResolvedValue(undefined);
let mockRevalidatorState: 'idle' | 'loading' = 'idle';

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useRevalidator: () => ({
      revalidate: mockRevalidate,
      state: mockRevalidatorState,
    }),
  };
});

vi.mock('~/hooks/use-route-loaders', () => ({
  useProfileData: () => ({
    type: 'owner',
    profile: { id: 'user-1', displayName: 'Guardian' },
  }),
  useNavigationState: () => ({
    scope: 'idle',
    isNavigating: false,
    isCrossRoute: false,
    isSameRoute: false,
    isSubTab: false,
    isScopedPending: false,
    nextLocation: undefined,
  }),
}));

vi.mock('~/lib/firebaseConfig', () => ({
  subscribeToDocument: vi.fn(() => vi.fn()),
}));

describe('Session Page Route Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRevalidatorState = 'idle';
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('subscribes to Firestore document updates when session status is pending', () => {
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

    expect(subscribeToDocument).toHaveBeenCalledWith(
      'sessions',
      'session-live',
      expect.objectContaining({
        onData: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it('does not subscribe to Firestore document updates when session status is complete', () => {
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

    expect(subscribeToDocument).not.toHaveBeenCalled();
  });

  it('keeps Firestore subscription active for a completed session while compTracking.end is finalizing', () => {
    vi.useFakeTimers();
    let callbacks: DocumentSubscriptionCallbacks<unknown> | undefined;
    vi.mocked(subscribeToDocument).mockImplementationOnce(
      (_collection, _docId, cbs) => {
        callbacks = cbs as DocumentSubscriptionCallbacks<unknown>;
        return vi.fn();
      },
    );

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

    expect(subscribeToDocument).toHaveBeenCalledTimes(1);
    expect(callbacks).toBeDefined();

    callbacks!.onData({
      id: 'session-comp-finalizing',
      status: 'complete',
      aggregateIds: ['game-1'],
      compTracking: {
        enabled: true,
        start: { divisionName: 'Platinum III', points: 5820, stepIndex: 21 },
        end: { divisionName: 'Platinum II', points: 6045, stepIndex: 22 },
        pointDelta: 225,
      },
    });

    expect(mockRevalidate).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(SESSION_SNAPSHOT_REVALIDATE_DEBOUNCE_MS);
    });
    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it('revalidates when Firestore sends a subsequent real-time update', () => {
    vi.useFakeTimers();
    let callbacks: DocumentSubscriptionCallbacks<unknown> | undefined;
    vi.mocked(subscribeToDocument).mockImplementationOnce(
      (_collection, _docId, cbs) => {
        callbacks = cbs as DocumentSubscriptionCallbacks<unknown>;
        return vi.fn();
      },
    );

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

    expect(callbacks).toBeDefined();

    // First snapshot represents initial sync with identical state
    callbacks!.onData({
      id: 'session-fresh',
      status: 'pending',
      aggregateIds: [],
    });
    act(() => {
      vi.advanceTimersByTime(SESSION_SNAPSHOT_REVALIDATE_DEBOUNCE_MS);
    });
    expect(mockRevalidate).not.toHaveBeenCalled();

    // Subsequent snapshot represents an incoming match from Firestore
    callbacks!.onData({
      id: 'session-fresh',
      status: 'pending',
      aggregateIds: ['new-aggregate-1'],
    });
    expect(mockRevalidate).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(SESSION_SNAPSHOT_REVALIDATE_DEBOUNCE_MS);
    });
    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it('revalidates on initial snapshot if Firestore data is already ahead of loaderData', () => {
    vi.useFakeTimers();
    let callbacks: DocumentSubscriptionCallbacks<unknown> | undefined;
    vi.mocked(subscribeToDocument).mockImplementationOnce(
      (_collection, _docId, cbs) => {
        callbacks = cbs as DocumentSubscriptionCallbacks<unknown>;
        return vi.fn();
      },
    );

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

    expect(callbacks).toBeDefined();

    // Initial snapshot arrives with already processed game
    callbacks!.onData({
      id: 'session-fresh',
      status: 'pending',
      aggregateIds: ['already-recorded-game'],
    });

    act(() => {
      vi.advanceTimersByTime(SESSION_SNAPSHOT_REVALIDATE_DEBOUNCE_MS);
    });
    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it('coalesces rapid multi-field Firestore writes into a single debounced revalidation', () => {
    vi.useFakeTimers();
    let callbacks: DocumentSubscriptionCallbacks<unknown> | undefined;
    vi.mocked(subscribeToDocument).mockImplementationOnce(
      (_collection, _docId, cbs) => {
        callbacks = cbs as DocumentSubscriptionCallbacks<unknown>;
        return vi.fn();
      },
    );

    const props = {
      loaderData: {
        session: {
          id: 'session-burst',
          name: 'Burst Session',
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

    expect(callbacks).toBeDefined();

    // Initial sync matches loaderData
    callbacks!.onData({
      id: 'session-burst',
      status: 'pending',
      aggregateIds: [],
    });

    // Simulate 3 rapid writes within 135ms (e.g. setLastSnapshot + persistSessionProgress)
    callbacks!.onData({
      id: 'session-burst',
      status: 'pending',
      aggregateIds: ['game-1'],
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    callbacks!.onData({
      id: 'session-burst',
      status: 'pending',
      aggregateIds: ['game-1'],
      lastSeenActivityId: 'act-1',
    });
    act(() => {
      vi.advanceTimersByTime(85);
    });
    callbacks!.onData({
      id: 'session-burst',
      status: 'pending',
      aggregateIds: ['game-1'],
      lastSeenActivityId: 'act-1',
      summary: { totalMatches: 1 },
    });

    act(() => {
      vi.advanceTimersByTime(SESSION_SNAPSHOT_REVALIDATE_DEBOUNCE_MS - 1);
    });
    expect(mockRevalidate).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it('cancels pending debounced revalidation timer on unmount', () => {
    vi.useFakeTimers();
    const mockUnsubscribe = vi.fn();
    let callbacks: DocumentSubscriptionCallbacks<unknown> | undefined;
    vi.mocked(subscribeToDocument).mockImplementationOnce(
      (_collection, _docId, cbs) => {
        callbacks = cbs as DocumentSubscriptionCallbacks<unknown>;
        return mockUnsubscribe;
      },
    );

    const props = {
      loaderData: {
        session: {
          id: 'session-unmount',
          name: 'Unmount Session',
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

    const { unmount } = render(
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>,
    );

    expect(callbacks).toBeDefined();

    callbacks!.onData({
      id: 'session-unmount',
      status: 'pending',
      aggregateIds: ['game-1'],
    });

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(SESSION_SNAPSHOT_REVALIDATE_DEBOUNCE_MS * 2);
    });
    expect(mockRevalidate).not.toHaveBeenCalled();
  });

  it('guards against overlapping revalidations while revalidator.state is loading and flushes once idle', () => {
    vi.useFakeTimers();
    mockRevalidatorState = 'loading';
    let callbacks: DocumentSubscriptionCallbacks<unknown> | undefined;
    vi.mocked(subscribeToDocument).mockImplementationOnce(
      (_collection, _docId, cbs) => {
        callbacks = cbs as DocumentSubscriptionCallbacks<unknown>;
        return vi.fn();
      },
    );

    const props = {
      loaderData: {
        session: {
          id: 'session-busy',
          name: 'Busy Session',
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

    let triggerRerender!: () => void;
    function SessionRevalidatorHarness() {
      const [, setTick] = useState(0);
      triggerRerender = () => setTick((t) => t + 1);
      return <Session {...props} />;
    }

    const router = createMemoryRouter([
      {
        path: '/',
        element: <SessionRevalidatorHarness />,
      },
    ]);

    render(
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>,
    );

    expect(callbacks).toBeDefined();

    callbacks!.onData({
      id: 'session-busy',
      status: 'pending',
      aggregateIds: ['game-1'],
    });

    act(() => {
      vi.advanceTimersByTime(SESSION_SNAPSHOT_REVALIDATE_DEBOUNCE_MS);
    });
    expect(mockRevalidate).not.toHaveBeenCalled();

    // Once revalidator becomes idle, the deferred update flushes cleanly without re-subscribing
    mockRevalidatorState = 'idle';
    act(() => {
      triggerRerender();
    });

    act(() => {
      vi.advanceTimersByTime(SESSION_SNAPSHOT_REVALIDATE_DEBOUNCE_MS);
    });
    expect(subscribeToDocument).toHaveBeenCalledTimes(1);
    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it('handles Firestore subscription errors gracefully without throwing', () => {
    let callbacks: DocumentSubscriptionCallbacks<unknown> | undefined;
    vi.mocked(subscribeToDocument).mockImplementationOnce(
      (_collection, _docId, cbs) => {
        callbacks = cbs as DocumentSubscriptionCallbacks<unknown>;
        return vi.fn();
      },
    );

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

    expect(callbacks?.onError).toBeDefined();
    expect(() => {
      callbacks!.onError!(new Error('Connection lost'));
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

  it('keeps the Firestore listener alive across re-renders when revalidate callback is stable', () => {
    const unsubscribe = vi.fn();
    vi.mocked(subscribeToDocument).mockReturnValueOnce(unsubscribe);

    const props = {
      loaderData: {
        session: {
          id: 'session-stable',
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

    const { rerender } = render(
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>,
    );

    expect(subscribeToDocument).toHaveBeenCalledTimes(1);

    rerender(
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>,
    );

    expect(unsubscribe).not.toHaveBeenCalled();
    expect(subscribeToDocument).toHaveBeenCalledTimes(1);
  });
});
