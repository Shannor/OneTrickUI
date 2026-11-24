import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type CharacterSnapshot,
  getBestPerformingLoadouts,
  getUserSessions,
} from '~/api';
import {
  EMPTY_TOP_LOADOUTS,
  type TopLoadoutsResult,
} from '~/components/top-loadouts-section';

import Home, { loader } from './home';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const mockUseProfileData = vi.fn();

vi.mock('~/hooks/use-route-loaders', () => ({
  useProfileData: () => mockUseProfileData(),
}));

vi.mock('~/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api')>();
  return {
    ...actual,
    getUserSessions: vi.fn(),
    getBestPerformingLoadouts: vi.fn(),
  };
});

const emptyLoadoutsResult: TopLoadoutsResult = {
  data: EMPTY_TOP_LOADOUTS,
  error: undefined,
};

const mockTopSnapshot: CharacterSnapshot = {
  id: 'snap-top-1',
  name: 'Void Rose Hunter',
  userId: 'user-1',
  characterId: 'char-1',
  hash: 'hash-top-1',
  createdAt: new Date('2025-02-01T00:00:00Z'),
  updatedAt: new Date('2025-02-01T00:00:00Z'),
  loadout: {},
};

describe('Home Page Route Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts getBestPerformingLoadouts in parallel and returns immediately once getUserSessions resolves', async () => {
    const loadoutsDeferred = createDeferred<any>();
    const sessions = [{ id: 'session-1', name: 'Trials Run 1' }];

    vi.mocked(getBestPerformingLoadouts).mockReturnValueOnce(
      loadoutsDeferred.promise,
    );
    vi.mocked(getUserSessions).mockResolvedValueOnce({
      data: sessions,
      error: undefined,
    } as any);

    const result = await loader({
      params: { id: 'user-1', characterId: 'char-1' },
      context: new Map(),
    } as any);

    expect(getBestPerformingLoadouts).toHaveBeenCalledTimes(1);
    expect(getUserSessions).toHaveBeenCalledTimes(1);
    expect(result.error).toBeUndefined();
    expect(result.sessions).toEqual(sessions);
    expect(result.loadouts).toBeInstanceOf(Promise);

    loadoutsDeferred.resolve({
      data: {
        items: [mockTopSnapshot],
        count: { 'snap-top-1': 12 },
        stats: {},
      },
      error: undefined,
    });

    const resolvedLoadouts = await result.loadouts;
    expect(resolvedLoadouts.error).toBeUndefined();
    expect(resolvedLoadouts.data.items).toEqual([mockTopSnapshot]);
  });

  it('degrades only loadouts when getBestPerformingLoadouts returns an error or rejects', async () => {
    const sessions = [{ id: 'session-1', name: 'Trials Run 1' }];

    vi.mocked(getBestPerformingLoadouts).mockResolvedValueOnce({
      data: undefined,
      error: { message: 'firestore timeout' },
    } as any);
    vi.mocked(getUserSessions).mockResolvedValueOnce({
      data: sessions,
      error: undefined,
    } as any);

    const apiErrorRes = await loader({
      params: { id: 'user-1', characterId: 'char-1' },
      context: new Map(),
    } as any);

    expect(apiErrorRes.error).toBeUndefined();
    expect(apiErrorRes.sessions).toEqual(sessions);
    expect(await apiErrorRes.loadouts).toEqual({
      data: EMPTY_TOP_LOADOUTS,
      error: 'Failed to load top loadouts',
    });

    vi.mocked(getBestPerformingLoadouts).mockRejectedValueOnce(
      new Error('network error'),
    );
    vi.mocked(getUserSessions).mockResolvedValueOnce({
      data: sessions,
      error: undefined,
    } as any);

    const rejectRes = await loader({
      params: { id: 'user-1', characterId: 'char-1' },
      context: new Map(),
    } as any);

    expect(rejectRes.error).toBeUndefined();
    expect(rejectRes.sessions).toEqual(sessions);
    expect(await rejectRes.loadouts).toEqual({
      data: EMPTY_TOP_LOADOUTS,
      error: 'Failed to load top loadouts',
    });
  });

  it('returns page-level error when getUserSessions fails', async () => {
    vi.mocked(getBestPerformingLoadouts).mockRejectedValueOnce(
      new Error('ignored secondary error'),
    );
    vi.mocked(getUserSessions).mockRejectedValueOnce(
      new Error('sessions failure'),
    );

    const result = await loader({
      params: { id: 'user-1', characterId: 'char-1' },
      context: new Map(),
    } as any);

    expect(result.error).toBe('Failed to load home page data');
    expect(result.sessions).toEqual([]);
  });
});

describe('Home Page Route Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfileData.mockReturnValue({
      type: 'owner',
      profile: {
        id: 'user-1',
        displayName: 'TestGuardian',
        characters: [{ id: 'char-1', class: 'Hunter' }],
      },
      character: { id: 'char-1', class: 'Hunter' },
    });
  });

  it('renders RecentFormPulse immediately with Top Loadouts skeleton while loadouts promise is pending, then streams cards on resolve', async () => {
    const loadoutsDeferred = createDeferred<TopLoadoutsResult>();
    const mockSession = {
      id: 'session-1',
      name: 'Trials Run 1',
      userId: 'user-1',
      characterId: 'char-1',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      aggregateIds: ['agg-1', 'agg-2'],
      status: 'complete' as const,
      summary: {
        totalMatches: 2,
        wins: 2,
        losses: 0,
        kdRatio: 1.75,
      },
    };

    const props = {
      loaderData: {
        sessions: [mockSession],
        loadouts: loadoutsDeferred.promise,
        error: undefined,
      },
      params: { id: 'user-1', characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText(/welcome testguardian/i)).toBeInTheDocument();
    expect(screen.getByText(/recent form \(1 session\)/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /trials run 1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Top Loadouts' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('top-loadouts-skeleton')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /view all loadouts/i }),
    ).not.toBeInTheDocument();

    await act(async () => {
      loadoutsDeferred.resolve({
        data: {
          items: [mockTopSnapshot],
          count: { 'snap-top-1': 15 },
          stats: {
            'snap-top-1': {
              kd: { value: 1.9 },
              kda: { value: 2.4 },
              standing: { value: 0.73 },
            },
          },
        },
        error: undefined,
      });
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId('top-loadouts-skeleton'),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('Void Rose Hunter')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /view all loadouts/i }),
    ).toBeInTheDocument();
  });

  it('degrades only Top Loadouts section when loadouts stream fails while keeping OverviewHeader and RecentFormPulse rendered', async () => {
    const loadoutsDeferred = createDeferred<TopLoadoutsResult>();
    const mockSession = {
      id: 'session-1',
      name: 'Trials Run 1',
      userId: 'user-1',
      characterId: 'char-1',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      aggregateIds: ['agg-1', 'agg-2'],
      status: 'complete' as const,
      summary: {
        totalMatches: 2,
        wins: 2,
        losses: 0,
        kdRatio: 1.75,
      },
    };

    const props = {
      loaderData: {
        sessions: [mockSession],
        loadouts: loadoutsDeferred.promise,
        error: undefined,
      },
      params: { id: 'user-1', characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    await act(async () => {
      loadoutsDeferred.resolve({
        data: EMPTY_TOP_LOADOUTS,
        error: 'Failed to load top loadouts',
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText('Unable to Load Top Loadouts'),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/welcome testguardian/i)).toBeInTheDocument();
    expect(screen.getByText(/recent form \(1 session\)/i)).toBeInTheDocument();
    expect(screen.queryByText('Unexpected Error')).not.toBeInTheDocument();
  });

  it('renders RecentFormPulse with session pill, direct Start Session CTA, and hides completed SessionCard when only completed sessions exist', () => {
    const mockSession = {
      id: 'session-1',
      name: 'Trials Run 1',
      userId: 'user-1',
      characterId: 'char-1',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      aggregateIds: ['agg-1', 'agg-2'],
      status: 'complete' as const,
      summary: {
        totalMatches: 2,
        wins: 2,
        losses: 0,
        kdRatio: 1.75,
      },
    };

    const props = {
      loaderData: {
        sessions: [mockSession],
        loadouts: emptyLoadoutsResult,
        error: undefined,
      },
      params: { id: 'user-1', characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText(/welcome testguardian/i)).toBeInTheDocument();
    expect(screen.getByText(/recent form \(1 session\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/recent session/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /trials run 1/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/all modes · min\. 10 games/i)).toBeInTheDocument();
    expect(screen.getByText('Get in the Crucible!')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /^start session$/i }),
    ).toBeInTheDocument();
  });

  it('renders RecentFormPulse with all recent sessions up to 5 when multiple sessions exist', () => {
    const mockSessions = [
      {
        id: 'session-1',
        name: 'Trials Run 1',
        userId: 'user-1',
        characterId: 'char-1',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        aggregateIds: ['agg-1', 'agg-2'],
        status: 'complete' as const,
        summary: {
          totalMatches: 4,
          wins: 3,
          losses: 1,
          kdRatio: 1.5,
        },
      },
      {
        id: 'session-2',
        name: 'Control Warmup',
        userId: 'user-1',
        characterId: 'char-1',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        aggregateIds: ['agg-3', 'agg-4'],
        status: 'complete' as const,
        summary: {
          totalMatches: 4,
          wins: 2,
          losses: 2,
          kdRatio: 1.1,
        },
      },
    ];

    const props = {
      loaderData: {
        sessions: mockSessions,
        loadouts: emptyLoadoutsResult,
        error: undefined,
      },
      params: { id: 'user-1', characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText(/recent form \(2 sessions\)/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /trials run 1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /control warmup/i }),
    ).toBeInTheDocument();
  });

  it('renders empty sessions state with a single primary Start First Session CTA in the empty card', () => {
    const props = {
      loaderData: {
        sessions: [],
        loadouts: emptyLoadoutsResult,
        error: undefined,
      },
      params: { id: 'user-1', characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', { name: 'Sessions' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Active Session' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('No Sessions Recorded')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /browse community sessions/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Get in the Crucible!')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /start first session/i }),
    ).toBeInTheDocument();
  });

  it('renders Stop Session CTA when owner has an active pending session', () => {
    const activeSession = {
      id: 'session-live',
      name: 'Live Crucible',
      userId: 'user-1',
      characterId: 'char-1',
      startedAt: new Date().toISOString(),
      status: 'pending' as const,
    };

    const props = {
      loaderData: {
        sessions: [activeSession],
        loadouts: emptyLoadoutsResult,
        error: undefined,
      },
      params: { id: 'user-1', characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    const { container } = render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('button', { name: /stop session/i }),
    ).toBeInTheDocument();
    expect(
      container.querySelector('form[action="/action/end-session"]'),
    ).toBeInTheDocument();
  });

  it('does not render session start or stop forms when viewer inspects profile', () => {
    mockUseProfileData.mockReturnValue({
      type: 'viewer',
      profile: {
        id: 'user-1',
        displayName: 'TestGuardian',
        characters: [{ id: 'char-1', class: 'Hunter' }],
      },
      character: { id: 'char-1', class: 'Hunter' },
    });

    const props = {
      loaderData: {
        sessions: [],
        loadouts: emptyLoadoutsResult,
        error: undefined,
      },
      params: { id: 'user-1', characterId: 'char-1' },
    } as unknown as ComponentProps<typeof Home>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <Home {...props} />,
      },
    ]);

    const { container } = render(<RouterProvider router={router} />);

    expect(screen.getByText(/viewing testguardian/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /start.*session/i }),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('form[action="/action/end-session"]'),
    ).not.toBeInTheDocument();
  });
});
