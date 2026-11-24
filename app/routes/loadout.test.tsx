import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import { type ComponentProps, startTransition, useState } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuth } from '~/.server/auth';
import { loggerContext } from '~/.server/logger';
import {
  type CharacterSnapshot,
  getSimilarSnapshots,
  getSnapshot,
} from '~/api';
import { TooltipProvider } from '~/components/ui/tooltip';

import { Loadout, loader } from './loadout';

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

vi.mock('~/.server/auth', () => ({
  getAuth: vi.fn(),
}));

vi.mock('~/hooks/use-route-loaders', () => ({
  useProfileData: () => mockUseProfileData(),
}));

vi.mock('~/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api')>();
  return {
    ...actual,
    getSnapshot: vi.fn(),
    getSimilarSnapshots: vi.fn(),
  };
});

describe('loadout route loader and component', () => {
  const mockSnapshot: CharacterSnapshot = {
    id: 'snap-archived',
    name: 'Archived Loadout',
    userId: 'user-1',
    characterId: 'char-1',
    hash: 'hash-1',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    loadout: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfileData.mockReturnValue({
      type: 'owner',
      profile: { id: 'user-1', displayName: 'TestGuardian' },
      character: { id: 'char-1', class: 'Hunter' },
    });
  });

  it('redirects synchronously to target loadout route when snapshot.mergedIntoId is present without calling getSimilarSnapshots even for owners', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({ id: 'user-1' } as any);
    vi.mocked(getSnapshot).mockResolvedValueOnce({
      data: {
        ...mockSnapshot,
        mergedIntoId: 'snap-target-999',
      },
      error: undefined,
    } as any);

    const request = new Request(
      'http://localhost/profile/user-1/c/char-1/loadouts/snap-archived',
    );
    const response = (await loader({
      request,
      params: {
        id: 'user-1',
        characterId: 'char-1',
        snapshotId: 'snap-archived',
      },
      context: new Map(),
    } as any)) as Response;

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(
      '/profile/user-1/c/char-1/loadouts/snap-target-999',
    );
    expect(getSimilarSnapshots).not.toHaveBeenCalled();
  });

  it('returns immediately on non-/similar routes while getSimilarSnapshots is pending with includeStats: false, and skips for non-owners', async () => {
    const similarDeferred = createDeferred<any>();
    vi.mocked(getAuth).mockResolvedValueOnce({ id: 'user-1' } as any);
    vi.mocked(getSnapshot).mockResolvedValueOnce({
      data: mockSnapshot,
      error: undefined,
    } as any);
    vi.mocked(getSimilarSnapshots).mockReturnValueOnce(similarDeferred.promise);

    const ownerReq = new Request(
      'http://localhost/profile/user-1/c/char-1/loadouts/snap-archived',
    );
    const result = (await loader({
      request: ownerReq,
      params: {
        id: 'user-1',
        characterId: 'char-1',
        snapshotId: 'snap-archived',
      },
      context: new Map(),
    } as any)) as any;

    expect(result.snapshot).toEqual(mockSnapshot);
    expect(result.similarCount).toBeInstanceOf(Promise);
    expect(getSimilarSnapshots).toHaveBeenCalledTimes(1);
    expect(getSimilarSnapshots).toHaveBeenCalledWith({
      path: { snapshotId: 'snap-archived' },
      query: { includeStats: false },
    });

    similarDeferred.resolve({
      data: {
        target: mockSnapshot,
        items: [{ snapshot: { ...mockSnapshot, id: 'sim-1' }, tier: 'high' }],
      },
      error: undefined,
    });
    expect(await result.similarCount).toBe(1);

    vi.mocked(getAuth).mockResolvedValueOnce({ id: 'other-viewer' } as any);
    vi.mocked(getSnapshot).mockResolvedValueOnce({
      data: mockSnapshot,
      error: undefined,
    } as any);

    const viewerReq = new Request(
      'http://localhost/profile/user-1/c/char-1/loadouts/snap-archived',
    );
    const viewerResult = (await loader({
      request: viewerReq,
      params: {
        id: 'user-1',
        characterId: 'char-1',
        snapshotId: 'snap-archived',
      },
      context: new Map(),
    } as any)) as any;

    expect(viewerResult.similarCount).toBe(0);
    expect(getSimilarSnapshots).toHaveBeenCalledTimes(1);
  });

  it('streams similarCount without blocking on /metrics route and resolves safely to 0 on API errors or rejections', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({ id: 'user-1' } as any);
    vi.mocked(getSnapshot).mockResolvedValueOnce({
      data: mockSnapshot,
      error: undefined,
    } as any);
    vi.mocked(getSimilarSnapshots).mockResolvedValueOnce({
      data: undefined,
      error: { message: 'timeout' },
    } as any);

    const metricsReq = new Request(
      'http://localhost/profile/user-1/c/char-1/loadouts/snap-archived/metrics',
    );
    const errorResult = (await loader({
      request: metricsReq,
      params: {
        id: 'user-1',
        characterId: 'char-1',
        snapshotId: 'snap-archived',
      },
      context: new Map(),
    } as any)) as any;

    expect(errorResult.snapshot).toEqual(mockSnapshot);
    expect(errorResult.similarCount).toBeInstanceOf(Promise);
    expect(await errorResult.similarCount).toBe(0);

    vi.mocked(getAuth).mockResolvedValueOnce({ id: 'user-1' } as any);
    vi.mocked(getSnapshot).mockResolvedValueOnce({
      data: mockSnapshot,
      error: undefined,
    } as any);
    vi.mocked(getSimilarSnapshots).mockRejectedValueOnce(
      new Error('backend down'),
    );

    const rejectReq = new Request(
      'http://localhost/profile/user-1/c/char-1/loadouts/snap-archived',
    );
    const rejectResult = (await loader({
      request: rejectReq,
      params: {
        id: 'user-1',
        characterId: 'char-1',
        snapshotId: 'snap-archived',
      },
      context: new Map(),
    } as any)) as any;

    expect(rejectResult.snapshot).toEqual(mockSnapshot);
    expect(await rejectResult.similarCount).toBe(0);
  });

  it('awaits resolved similarCount immediately when targeting /similar route', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({ id: 'user-1' } as any);
    vi.mocked(getSnapshot).mockResolvedValueOnce({
      data: mockSnapshot,
      error: undefined,
    } as any);
    vi.mocked(getSimilarSnapshots).mockResolvedValueOnce({
      data: {
        target: mockSnapshot,
        items: [
          { snapshot: { ...mockSnapshot, id: 'sim-1' }, tier: 'high' },
          { snapshot: { ...mockSnapshot, id: 'sim-2' }, tier: 'medium' },
        ],
      },
      error: undefined,
    } as any);

    const similarReq = new Request(
      'http://localhost/profile/user-1/c/char-1/loadouts/snap-archived/similar',
    );
    const result = (await loader({
      request: similarReq,
      params: {
        id: 'user-1',
        characterId: 'char-1',
        snapshotId: 'snap-archived',
      },
      context: new Map(),
    } as any)) as any;

    expect(result.similarCount).toBe(2);
    expect(getSimilarSnapshots).toHaveBeenCalledWith({
      path: { snapshotId: 'snap-archived' },
      query: { includeStats: true },
    });
  });

  it('renders "Similar" tab immediately while similarCount is pending and streams the count badge once resolved', async () => {
    const deferredCount = createDeferred<number>();
    const props = {
      loaderData: {
        snapshot: mockSnapshot,
        error: undefined,
        path: 'https://d2onetrick.com/profile/user-1/c/char-1/loadouts/snap-archived',
        similarCount: deferredCount.promise,
      },
    } as unknown as ComponentProps<typeof Loadout>;

    const router = createMemoryRouter(
      [
        {
          path: '/profile/:id/c/:characterId/loadouts/:snapshotId',
          element: (
            <TooltipProvider>
              <Loadout {...props} />
            </TooltipProvider>
          ),
        },
      ],
      {
        initialEntries: ['/profile/user-1/c/char-1/loadouts/snap-archived'],
      },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByRole('tab', { name: /loadout/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /metrics/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /similar/i })).toHaveTextContent(
      /^Similar$/,
    );

    await act(async () => {
      deferredCount.resolve(3);
    });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /similar/i })).toHaveTextContent(
        'Similar3',
      );
    });
  });

  it('renders gracefully without crashing when similarCount promise rejects', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const deferredCount = createDeferred<number>();
    const props = {
      loaderData: {
        snapshot: mockSnapshot,
        error: undefined,
        path: 'https://d2onetrick.com/profile/user-1/c/char-1/loadouts/snap-archived',
        similarCount: deferredCount.promise,
      },
    } as unknown as ComponentProps<typeof Loadout>;

    const router = createMemoryRouter(
      [
        {
          path: '/profile/:id/c/:characterId/loadouts/:snapshotId',
          element: (
            <TooltipProvider>
              <Loadout {...props} />
            </TooltipProvider>
          ),
        },
      ],
      {
        initialEntries: ['/profile/user-1/c/char-1/loadouts/snap-archived'],
      },
    );

    render(<RouterProvider router={router} />);

    await act(async () => {
      deferredCount.reject(new Error('stream aborted'));
    });

    expect(screen.getByRole('tab', { name: /similar/i })).toHaveTextContent(
      /^Similar$/,
    );
    expect(screen.getByRole('tab', { name: /loadout/i })).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('renders "Similar" tab with synchronous count for owner and hides for non-owner', () => {
    const props = {
      loaderData: {
        snapshot: mockSnapshot,
        error: undefined,
        path: 'https://d2onetrick.com/profile/user-1/c/char-1/loadouts/snap-archived',
        similarCount: 4,
      },
    } as unknown as ComponentProps<typeof Loadout>;

    const router = createMemoryRouter(
      [
        {
          path: '/profile/:id/c/:characterId/loadouts/:snapshotId',
          element: (
            <TooltipProvider>
              <Loadout {...props} />
            </TooltipProvider>
          ),
        },
      ],
      {
        initialEntries: ['/profile/user-1/c/char-1/loadouts/snap-archived'],
      },
    );

    const { unmount } = render(<RouterProvider router={router} />);
    expect(screen.getByRole('tab', { name: /similar/i })).toHaveTextContent(
      'Similar4',
    );
    unmount();

    mockUseProfileData.mockReturnValue({
      type: 'public',
      profile: { id: 'user-1', displayName: 'TestGuardian' },
      character: { id: 'char-1', class: 'Hunter' },
    });

    const publicRouter = createMemoryRouter(
      [
        {
          path: '/profile/:id/c/:characterId/loadouts/:snapshotId',
          element: (
            <TooltipProvider>
              <Loadout {...props} />
            </TooltipProvider>
          ),
        },
      ],
      {
        initialEntries: ['/profile/user-1/c/char-1/loadouts/snap-archived'],
      },
    );

    render(<RouterProvider router={publicRouter} />);
    expect(
      screen.queryByRole('tab', { name: /similar/i }),
    ).not.toBeInTheDocument();
  });

  it('forks evlog logger when streaming similarCount on non-/similar routes and uses direct logger on /similar', async () => {
    const forkSpy = vi.fn(
      async (_label: string, fn: () => void | Promise<void>) => {
        await fn();
      },
    );
    const mockLog = {
      set: vi.fn(),
      error: vi.fn(),
      fork: forkSpy,
    };
    const context = {
      get: vi.fn((key) => (key === loggerContext ? mockLog : undefined)),
    };

    vi.mocked(getAuth).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(getSnapshot).mockResolvedValue({
      data: mockSnapshot,
      error: undefined,
    } as any);
    vi.mocked(getSimilarSnapshots).mockResolvedValue({
      data: {
        target: mockSnapshot,
        items: [{ snapshot: { ...mockSnapshot, id: 'sim-1' }, tier: 'high' }],
      },
      error: undefined,
    } as any);

    const detailsRes = (await loader({
      request: new Request(
        'http://localhost/profile/user-1/c/char-1/loadouts/snap-archived',
      ),
      params: {
        id: 'user-1',
        characterId: 'char-1',
        snapshotId: 'snap-archived',
      },
      context,
    } as any)) as any;

    expect(forkSpy).toHaveBeenCalledTimes(1);
    expect(forkSpy).toHaveBeenCalledWith(
      'loadout.similar_count',
      expect.any(Function),
    );
    expect(await detailsRes.similarCount).toBe(1);

    forkSpy.mockClear();

    const similarRes = (await loader({
      request: new Request(
        'http://localhost/profile/user-1/c/char-1/loadouts/snap-archived/similar',
      ),
      params: {
        id: 'user-1',
        characterId: 'char-1',
        snapshotId: 'snap-archived',
      },
      context,
    } as any)) as any;

    expect(forkSpy).not.toHaveBeenCalled();
    expect(similarRes.similarCount).toBe(1);
  });

  it('resets SimilarCountBadge Suspense boundary when navigating between loadouts inside startTransition', async () => {
    const snap2: CharacterSnapshot = {
      ...mockSnapshot,
      id: 'snap-second',
      name: 'Second Loadout',
    };
    const snap2CountDeferred = createDeferred<number>();
    let switchToSnap2!: () => void;

    function LoadoutSwitchHarness() {
      const [state, setState] = useState<{
        snapshot: CharacterSnapshot;
        similarCount: number | Promise<number>;
      }>({
        snapshot: mockSnapshot,
        similarCount: 4,
      });

      switchToSnap2 = () => {
        startTransition(() => {
          setState({
            snapshot: snap2,
            similarCount: snap2CountDeferred.promise,
          });
        });
      };

      const props = {
        loaderData: {
          snapshot: state.snapshot,
          error: undefined,
          path: `https://d2onetrick.com/profile/user-1/c/char-1/loadouts/${state.snapshot.id}`,
          similarCount: state.similarCount,
        },
      } as unknown as ComponentProps<typeof Loadout>;

      return (
        <TooltipProvider>
          <Loadout {...props} />
        </TooltipProvider>
      );
    }

    const router = createMemoryRouter(
      [
        {
          path: '/profile/:id/c/:characterId/loadouts/:snapshotId',
          element: <LoadoutSwitchHarness />,
        },
      ],
      {
        initialEntries: ['/profile/user-1/c/char-1/loadouts/snap-archived'],
      },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByRole('tab', { name: /similar/i })).toHaveTextContent(
      'Similar4',
    );

    await act(async () => {
      switchToSnap2();
    });

    expect(screen.getByDisplayValue('Second Loadout')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /similar/i })).toHaveTextContent(
      /^Similar$/,
    );

    await act(async () => {
      snap2CountDeferred.resolve(2);
    });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /similar/i })).toHaveTextContent(
        'Similar2',
      );
    });
  });
});
