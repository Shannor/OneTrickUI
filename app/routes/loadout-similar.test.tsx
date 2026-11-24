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

import { loader as loadoutLoader } from './loadout';
import { LoadoutSimilar, loader } from './loadout-similar';

const mockUseOptionalProfileData = vi.fn();
const mockUseLoadoutData = vi.fn();

vi.mock('~/.server/auth', () => ({
  getAuth: vi.fn(),
}));

vi.mock('~/hooks/use-route-loaders', () => ({
  useOptionalProfileData: () => mockUseOptionalProfileData(),
  useLoadoutData: () => mockUseLoadoutData(),
}));

vi.mock('~/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api')>();
  return {
    ...actual,
    getSnapshot: vi.fn(),
    getSimilarSnapshots: vi.fn(),
  };
});

describe('loadout-similar route loader and component', () => {
  const targetSnapshot: CharacterSnapshot = {
    id: 'snap-target',
    name: 'Trials Prismatic Hunter',
    userId: 'user-1',
    characterId: 'char-1',
    hash: 'hash-target',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    loadout: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOptionalProfileData.mockReturnValue({
      type: 'owner',
      profile: { id: 'user-1', displayName: 'TestGuardian' },
      character: { id: 'char-1', class: 'Hunter' },
    });
    mockUseLoadoutData.mockReturnValue({
      snapshot: targetSnapshot,
      path: 'https://d2onetrick.com/profile/user-1/c/char-1/loadouts/snap-target',
    });
  });

  it('deduplicates getSimilarSnapshots across parent loadout and child loadout-similar loaders on the same request', async () => {
    vi.mocked(getAuth).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(getSnapshot).mockResolvedValueOnce({
      data: targetSnapshot,
      error: undefined,
    } as any);
    vi.mocked(getSimilarSnapshots).mockResolvedValueOnce({
      data: {
        target: targetSnapshot,
        items: [
          {
            snapshot: { ...targetSnapshot, id: 'snap-sim-1', name: 'Roll B' },
            tier: 'high',
            exoticArmorMatch: true,
            powerWeaponMatch: true,
            armorSetBonusMatch: true,
          },
        ],
        stats: {},
        count: { 'snap-target': 10, 'snap-sim-1': 4 },
      },
      error: undefined,
    } as any);

    const sharedRequest = new Request(
      'http://localhost/profile/user-1/c/char-1/loadouts/snap-target/similar',
    );
    const params = {
      id: 'user-1',
      characterId: 'char-1',
      snapshotId: 'snap-target',
    };

    const [parentRes, childRes] = await Promise.all([
      loadoutLoader({
        request: sharedRequest,
        params,
        context: new Map(),
      } as any),
      loader({
        request: sharedRequest,
        params,
        context: new Map(),
      } as any),
    ]);

    expect(getSimilarSnapshots).toHaveBeenCalledTimes(1);
    expect(getSimilarSnapshots).toHaveBeenCalledWith({
      path: { snapshotId: 'snap-target' },
      query: { includeStats: true },
    });
    expect((parentRes as any).similarCount).toBe(1);
    expect(childRes.error).toBeNull();
    expect(childRes.similarData?.target.id).toBe('snap-target');
    expect(childRes.similarData?.items).toHaveLength(1);
  });

  it('deduplicates getSimilarSnapshots on /similar.data requests and returns resolved count from parent loader', async () => {
    vi.mocked(getAuth).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(getSnapshot).mockResolvedValueOnce({
      data: targetSnapshot,
      error: undefined,
    } as any);
    vi.mocked(getSimilarSnapshots).mockResolvedValueOnce({
      data: {
        target: targetSnapshot,
        items: [
          {
            snapshot: { ...targetSnapshot, id: 'snap-sim-1', name: 'Roll B' },
            tier: 'high',
          },
          {
            snapshot: { ...targetSnapshot, id: 'snap-sim-2', name: 'Roll C' },
            tier: 'medium',
          },
        ],
        stats: {},
        count: { 'snap-target': 10, 'snap-sim-1': 4, 'snap-sim-2': 2 },
      },
      error: undefined,
    } as any);

    const sharedDataRequest = new Request(
      'http://localhost/profile/user-1/c/char-1/loadouts/snap-target/similar.data',
    );
    const params = {
      id: 'user-1',
      characterId: 'char-1',
      snapshotId: 'snap-target',
    };

    const [parentRes, childRes] = await Promise.all([
      loadoutLoader({
        request: sharedDataRequest,
        params,
        context: new Map(),
      } as any),
      loader({
        request: sharedDataRequest,
        params,
        context: new Map(),
      } as any),
    ]);

    expect(getSimilarSnapshots).toHaveBeenCalledTimes(1);
    expect(getSimilarSnapshots).toHaveBeenCalledWith({
      path: { snapshotId: 'snap-target' },
      query: { includeStats: true },
    });
    expect((parentRes as any).similarCount).toBe(2);
    expect(childRes.similarData?.items).toHaveLength(2);
  });

  it('skips getSimilarSnapshots in loader when viewer is not the owner', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({ id: 'someone-else' } as any);

    const request = new Request(
      'http://localhost/profile/user-1/c/char-1/loadouts/snap-target/similar',
    );
    const result = await loader({
      request,
      params: {
        id: 'user-1',
        characterId: 'char-1',
        snapshotId: 'snap-target',
      },
      context: new Map(),
    } as any);

    expect(getSimilarSnapshots).not.toHaveBeenCalled();
    expect(result).toEqual({ similarData: null, error: null });
  });

  it('renders SimilarLoadoutsView when user is owner', () => {
    const props = {
      loaderData: {
        similarData: {
          target: targetSnapshot,
          items: [
            {
              snapshot: { ...targetSnapshot, id: 'snap-sim-1', name: 'Roll B' },
              tier: 'high',
              exoticArmorMatch: true,
              powerWeaponMatch: true,
              armorSetBonusMatch: true,
            },
          ],
          stats: {},
          count: { 'snap-target': 10, 'snap-sim-1': 4 },
        },
        error: null,
      },
      params: {
        id: 'user-1',
        characterId: 'char-1',
        snapshotId: 'snap-target',
      },
    } as unknown as ComponentProps<typeof LoadoutSimilar>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <LoadoutSimilar {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(
      screen.getByText('Compare & Merge Similar Loadouts'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('primary-loadout-header')).toHaveTextContent(
      'Trials Prismatic Hunter',
    );
    expect(screen.getByTestId('high-similarity-group')).toHaveTextContent(
      'Roll B',
    );
  });

  it('renders Owner Access Required empty state when user is not owner', () => {
    mockUseOptionalProfileData.mockReturnValue({
      type: 'public',
      profile: { id: 'user-1', displayName: 'TestGuardian' },
    });

    const props = {
      loaderData: {
        similarData: null,
        error: null,
      },
      params: {
        id: 'user-1',
        characterId: 'char-1',
        snapshotId: 'snap-target',
      },
    } as unknown as ComponentProps<typeof LoadoutSimilar>;

    const router = createMemoryRouter([
      {
        path: '/',
        element: <LoadoutSimilar {...props} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('Owner Access Required')).toBeInTheDocument();
  });
});
