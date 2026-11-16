import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type CharacterSnapshot, getSimilarSnapshots } from '~/api';

import { LoadoutSimilar, loader } from './loadout-similar';

const mockUseOptionalProfileData = vi.fn();
const mockUseLoadoutData = vi.fn();

vi.mock('~/hooks/use-route-loaders', () => ({
  useOptionalProfileData: () => mockUseOptionalProfileData(),
  useLoadoutData: () => mockUseLoadoutData(),
}));

vi.mock('~/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api')>();
  return {
    ...actual,
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

  it('fetches similar snapshots in loader with includeStats: true', async () => {
    vi.mocked(getSimilarSnapshots).mockResolvedValueOnce({
      data: {
        target: targetSnapshot,
        items: [
          {
            snapshot: { ...targetSnapshot, id: 'snap-sim-1', name: 'Roll B' },
            tier: 'high',
            exoticArmorMatch: true,
            powerWeaponMatch: true,
          },
        ],
        stats: {},
        count: { 'snap-target': 10, 'snap-sim-1': 4 },
      },
      error: undefined,
    } as any);

    const result = await loader({
      params: {
        id: 'user-1',
        characterId: 'char-1',
        snapshotId: 'snap-target',
      },
      context: new Map(),
    } as any);

    expect(getSimilarSnapshots).toHaveBeenCalledWith({
      path: { snapshotId: 'snap-target' },
      query: { includeStats: true },
    });
    expect(result.error).toBeNull();
    expect(result.similarData?.target.id).toBe('snap-target');
    expect(result.similarData?.items).toHaveLength(1);
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
