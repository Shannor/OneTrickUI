import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { type ComponentProps, useState } from 'react';
import {
  RouterProvider,
  type ShouldRevalidateFunctionArgs,
  createMemoryRouter,
} from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '~/components/ui/tooltip';
import {
  type DocumentSubscriptionCallbacks,
  subscribeToDocument,
} from '~/lib/firebaseConfig';

import Session, {
  SESSION_SNAPSHOT_REVALIDATE_DEBOUNCE_MS,
  shouldRevalidate,
} from './session';

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

  it('renders solo sessions unchanged without empty fireteam companion chrome', () => {
    const props = {
      loaderData: {
        session: {
          id: 'session-solo',
          userId: 'user-1',
          characterId: 'char-1',
          name: 'Solo Grind',
          status: 'complete' as const,
          startedAt: new Date().toISOString(),
          aggregateIds: ['agg-1'],
          summary: {
            totalMatches: 1,
            companions: [],
          },
        },
        aggregates: [],
        snapshots: {},
        participants: {},
        error: undefined,
        path: 'http://localhost/test',
      },
      params: { characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Session>;

    const router = createMemoryRouter([
      { path: '/', element: <Session {...props} /> },
    ]);

    render(
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>,
    );

    expect(
      screen.queryByRole('region', { name: /fireteam companions/i }),
    ).not.toBeInTheDocument();
  });

  it('renders companion pills below tabs on Games and Metrics, supports multi-teammate AND toggling, preserves filter on Games/Metrics tabs, and links to single and multi-session character swaps', async () => {
    const props = {
      loaderData: {
        session: {
          id: 'session-fireteam',
          userId: 'user-1',
          characterId: 'char-1',
          name: 'Friday Trials',
          status: 'complete' as const,
          startedAt: new Date().toISOString(),
          aggregateIds: ['g1', 'g2', 'g3'],
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
                    sessionId: 'sess-tragic-1',
                    characterId: 'char-tragic-titan',
                    class: 'Titan',
                    emblemUrl: '/img/tragic.jpg',
                    sharedMatches: 2,
                  },
                ],
              },
              {
                userId: 'user-swap',
                displayName: 'Swapper',
                sharedMatches: 2,
                wins: 1,
                losses: 1,
                sessions: [
                  {
                    sessionId: 'sess-swap-hunter',
                    characterId: 'char-swap-hunter',
                    class: 'Hunter',
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
            id: 'g1',
            activityDetails: { isPrivate: false },
            snapshotLinks: {
              'char-1': { snapshotId: 's1' },
              'char-tragic-titan': { sessionId: 'sess-tragic-1' },
              'char-swap-hunter': { sessionId: 'sess-swap-hunter' },
            },
            performance: {
              'char-1': {
                playerStats: {
                  standing: { value: 0 },
                  fireTeamId: { value: 1 },
                },
              },
              'char-tragic-titan': {
                playerStats: {
                  standing: { value: 0 },
                  fireTeamId: { value: 1 },
                },
              },
              'char-swap-hunter': {
                playerStats: {
                  standing: { value: 0 },
                  fireTeamId: { value: 1 },
                },
              },
            },
          },
          {
            id: 'g2',
            activityDetails: { isPrivate: false },
            snapshotLinks: {
              'char-1': { snapshotId: 's1' },
              'char-tragic-titan': { sessionId: 'sess-tragic-1' },
            },
            performance: {
              'char-1': {
                playerStats: {
                  standing: { value: 0 },
                  fireTeamId: { value: 2 },
                },
              },
              'char-tragic-titan': {
                playerStats: {
                  standing: { value: 0 },
                  fireTeamId: { value: 2 },
                },
              },
            },
          },
          {
            id: 'g3',
            activityDetails: { isPrivate: false },
            snapshotLinks: {
              'char-1': { snapshotId: 's1' },
              'char-swap-warlock': { sessionId: 'sess-swap-warlock' },
            },
            performance: {
              'char-1': {
                playerStats: {
                  standing: { value: 1 },
                  fireTeamId: { value: 3 },
                },
              },
              'char-swap-warlock': {
                playerStats: {
                  standing: { value: 1 },
                  fireTeamId: { value: 3 },
                },
              },
            },
          },
        ],
        snapshots: {},
        participants: {
          'char-tragic-titan': {
            userId: 'user-tragic',
            displayName: 'Tragic',
            characterId: 'char-tragic-titan',
            class: 'Titan',
          },
          'char-swap-hunter': {
            userId: 'user-swap',
            displayName: 'Swapper',
            characterId: 'char-swap-hunter',
            class: 'Hunter',
          },
          'char-swap-warlock': {
            userId: 'user-swap',
            displayName: 'Swapper',
            characterId: 'char-swap-warlock',
            class: 'Warlock',
          },
        },
        error: undefined,
        path: 'http://localhost/test',
      },
      params: { characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Session>;

    const router = createMemoryRouter(
      [
        {
          path: '/profile/user-1/c/char-1/sessions/session-fireteam',
          element: <Session {...props} />,
          children: [
            { index: true, element: <div>Games Tab</div> },
            { path: 'metrics', element: <div>Metrics Tab</div> },
            { path: 'loadouts', element: <div>Loadouts Tab</div> },
          ],
        },
      ],
      {
        initialEntries: ['/profile/user-1/c/char-1/sessions/session-fireteam'],
      },
    );

    render(
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>,
    );

    const tragicToggle = screen.getByRole('button', { name: /tragic/i });
    const swapperToggle = screen.getByRole('button', {
      name: /swapper.*matches/i,
    });
    expect(tragicToggle).toHaveAttribute('aria-pressed', 'false');

    const tragicLink = screen.getByRole('link', {
      name: /view tragic's session \(titan\)/i,
    });
    expect(tragicLink).toHaveAttribute(
      'href',
      '/profile/user-tragic/c/char-tragic-titan/sessions/sess-tragic-1',
    );

    await act(async () => {
      tragicToggle.click();
    });

    expect(router.state.location.search).toBe('?teammate=user-tragic');
    expect(tragicToggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('2 of 3')).toBeInTheDocument();

    await act(async () => {
      swapperToggle.click();
    });

    expect(router.state.location.search).toBe(
      '?teammate=user-tragic&teammate=user-swap',
    );
    expect(swapperToggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Tragic & Swapper')).toBeInTheDocument();

    expect(screen.getByRole('tab', { name: /^metrics$/i })).toHaveAttribute(
      'href',
      '/profile/user-1/c/char-1/sessions/session-fireteam/metrics?teammate=user-tragic&teammate=user-swap',
    );
    expect(screen.getByRole('tab', { name: /^loadouts$/i })).toHaveAttribute(
      'href',
      '/profile/user-1/c/char-1/sessions/session-fireteam/loadouts',
    );

    await act(async () => {
      screen
        .getByRole('button', { name: /view swapper's 2 sessions/i })
        .click();
    });

    expect(screen.getByRole('link', { name: /hunter/i })).toHaveAttribute(
      'href',
      '/profile/user-swap/c/char-swap-hunter/sessions/sess-swap-hunter',
    );
    expect(screen.getByRole('link', { name: /warlock/i })).toHaveAttribute(
      'href',
      '/profile/user-swap/c/char-swap-warlock/sessions/sess-swap-warlock',
    );

    await act(async () => {
      screen.getByRole('button', { name: /clear filter/i }).click();
    });
    expect(router.state.location.search).toBe('');
  });

  it('shows the fireteam filter bar on Metrics and hides it on Loadouts', () => {
    const props = {
      loaderData: {
        session: {
          id: 'session-fireteam',
          userId: 'user-1',
          characterId: 'char-1',
          name: 'Friday Trials',
          status: 'complete' as const,
          startedAt: new Date().toISOString(),
          aggregateIds: ['g1'],
          summary: {
            totalMatches: 1,
            companions: [
              {
                userId: 'user-tragic',
                displayName: 'Tragic',
                sharedMatches: 1,
                wins: 1,
                losses: 0,
                sessions: [
                  {
                    sessionId: 'sess-tragic-1',
                    characterId: 'char-tragic-titan',
                    class: 'Titan',
                    sharedMatches: 1,
                  },
                ],
              },
            ],
          },
        },
        aggregates: [],
        snapshots: {},
        participants: {},
        error: undefined,
        path: 'http://localhost/test',
      },
      params: { characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Session>;

    const metricsRouter = createMemoryRouter(
      [
        {
          path: '/profile/user-1/c/char-1/sessions/session-fireteam',
          element: <Session {...props} />,
          children: [
            { path: 'metrics', element: <div>Metrics Tab</div> },
            { path: 'loadouts', element: <div>Loadouts Tab</div> },
          ],
        },
      ],
      {
        initialEntries: [
          '/profile/user-1/c/char-1/sessions/session-fireteam/metrics',
        ],
      },
    );

    const { unmount } = render(
      <TooltipProvider>
        <RouterProvider router={metricsRouter} />
      </TooltipProvider>,
    );

    expect(
      screen.getByRole('region', { name: /fireteam companions/i }),
    ).toBeInTheDocument();
    unmount();

    const loadoutsRouter = createMemoryRouter(
      [
        {
          path: '/profile/user-1/c/char-1/sessions/session-fireteam',
          element: <Session {...props} />,
          children: [{ path: 'loadouts', element: <div>Loadouts Tab</div> }],
        },
      ],
      {
        initialEntries: [
          '/profile/user-1/c/char-1/sessions/session-fireteam/loadouts',
        ],
      },
    );

    render(
      <TooltipProvider>
        <RouterProvider router={loadoutsRouter} />
      </TooltipProvider>,
    );

    expect(
      screen.queryByRole('region', { name: /fireteam companions/i }),
    ).not.toBeInTheDocument();
  });
});

describe('Session route shouldRevalidate', () => {
  const baseArgs = (
    overrides: Partial<ShouldRevalidateFunctionArgs>,
  ): ShouldRevalidateFunctionArgs =>
    ({
      currentParams: { sessionId: 'sess-1', id: 'u1', characterId: 'c1' },
      nextParams: { sessionId: 'sess-1', id: 'u1', characterId: 'c1' },
      currentUrl: new URL(
        'https://d2onetrick.com/profile/u1/c/c1/sessions/sess-1',
      ),
      nextUrl: new URL(
        'https://d2onetrick.com/profile/u1/c/c1/sessions/sess-1',
      ),
      formMethod: undefined,
      defaultShouldRevalidate: true,
      ...overrides,
    }) as ShouldRevalidateFunctionArgs;

  it('skips server revalidation when toggling ?teammate= search params or switching sub-tabs', () => {
    expect(
      shouldRevalidate(
        baseArgs({
          nextUrl: new URL(
            'https://d2onetrick.com/profile/u1/c/c1/sessions/sess-1?teammate=user-a',
          ),
        }),
      ),
    ).toBe(false);

    expect(
      shouldRevalidate(
        baseArgs({
          currentUrl: new URL(
            'https://d2onetrick.com/profile/u1/c/c1/sessions/sess-1/metrics?teammate=user-a',
          ),
          nextUrl: new URL(
            'https://d2onetrick.com/profile/u1/c/c1/sessions/sess-1/loadouts',
          ),
        }),
      ),
    ).toBe(false);
  });

  it('revalidates on cross-session navigation, non-GET mutations, and same-URL revalidator ticks', () => {
    expect(
      shouldRevalidate(
        baseArgs({
          nextParams: { sessionId: 'sess-2', id: 'u1', characterId: 'c1' },
          nextUrl: new URL(
            'https://d2onetrick.com/profile/u1/c/c1/sessions/sess-2',
          ),
          defaultShouldRevalidate: false,
        }),
      ),
    ).toBe(true);

    expect(
      shouldRevalidate(
        baseArgs({
          formMethod: 'POST',
          nextUrl: new URL(
            'https://d2onetrick.com/profile/u1/c/c1/sessions/sess-1?teammate=user-a',
          ),
          defaultShouldRevalidate: true,
        }),
      ),
    ).toBe(true);

    expect(
      shouldRevalidate(
        baseArgs({
          defaultShouldRevalidate: true,
        }),
      ),
    ).toBe(true);
  });
});
