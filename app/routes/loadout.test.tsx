import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuth } from '~/.server/auth';
import {
  type CharacterSnapshot,
  getSimilarSnapshots,
  getSnapshot,
} from '~/api';
import { TooltipProvider } from '~/components/ui/tooltip';

import { Loadout, loader } from './loadout';

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

  it('redirects to target loadout route when snapshot.mergedIntoId is present', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce(undefined);
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

  it('returns snapshot and similarCount when viewer is the owner, and skips getSimilarSnapshots for non-owners', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({ id: 'user-1' } as any);
    vi.mocked(getSnapshot).mockResolvedValueOnce({
      data: mockSnapshot,
      error: undefined,
    } as any);
    vi.mocked(getSimilarSnapshots).mockResolvedValueOnce({
      data: {
        target: mockSnapshot,
        items: [{ snapshot: { ...mockSnapshot, id: 'sim-1' }, tier: 'high' }],
      },
      error: undefined,
    } as any);

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
    expect(result.similarCount).toBe(1);
    expect(getSimilarSnapshots).toHaveBeenCalledTimes(1);

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

  it('renders "Similar" tab with count for owner and hides for non-owner', () => {
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
});
