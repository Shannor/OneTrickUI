import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CharacterSnapshot,
  GetSimilarSnapshotsResponse,
  PlayerStats,
  SimilarSnapshotItem,
} from '~/api';
import {
  CHEST_BUCKET,
  ENERGY_BUCKET,
  HELMET_BUCKET,
  KINETIC_BUCKET,
  POWER_BUCKET,
  SUBCLASS_BUCKET,
} from '~/hooks/use-loadout';

import { SimilarLoadoutsView } from './similar-loadouts-view';

vi.mock('~/components/ui/sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function buildTestSnapshot({
  id,
  name,
  exoticHelmetName = 'Wormhusk Crown',
  exoticHelmetHash = 1001n,
  legendaryChestName = 'Disaster Corps Vest',
  powerName = 'Boomslang-4fr',
  powerHash = 3001n,
  healthStat = 170,
  superStat = 80,
}: {
  id: string;
  name: string;
  exoticHelmetName?: string;
  exoticHelmetHash?: bigint;
  legendaryChestName?: string;
  powerName?: string;
  powerHash?: bigint;
  healthStat?: number;
  superStat?: number;
}): CharacterSnapshot {
  return {
    id,
    name,
    userId: 'user-1',
    characterId: 'char-1',
    hash: `hash-${id}`,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    stats: {
      '392767087': {
        name: 'Health',
        value: healthStat,
      } as any,
      '144602215': {
        name: 'Super',
        value: superStat,
      } as any,
      '1935470627': {
        name: 'Power',
        value: 548,
      } as any,
    },
    loadout: {
      [SUBCLASS_BUCKET]: {
        itemHash: 3284755031n,
        instanceId: '3284755031',
        name: 'Threadrunner',
        details: {
          baseInfo: {
            name: 'Threadrunner',
            itemHash: 3284755031n,
            instanceId: '3284755031',
            tierType: 2,
            tierTypeName: 'Basic',
          },
          perks: [],
          stats: {},
        },
      } as any,
      [KINETIC_BUCKET]: {
        itemHash: 1498876634n,
        instanceId: '6917529000000000001',
        name: 'Rose',
        details: {
          baseInfo: {
            name: 'Rose',
            itemHash: 1498876634n,
            instanceId: '6917529000000000001',
            tierType: 5,
            tierTypeName: 'Legendary',
          },
          perks: [],
          stats: {},
        },
      } as any,
      [ENERGY_BUCKET]: {
        itemHash: 2465295065n,
        instanceId: '6917529000000000002',
        name: 'Matador 64',
        details: {
          baseInfo: {
            name: 'Matador 64',
            itemHash: 2465295065n,
            instanceId: '6917529000000000002',
            tierType: 5,
            tierTypeName: 'Legendary',
          },
          perks: [],
          stats: {},
        },
      } as any,
      [POWER_BUCKET]: {
        itemHash: powerHash,
        instanceId: String(powerHash),
        name: powerName,
        details: {
          baseInfo: {
            name: powerName,
            itemHash: powerHash,
            instanceId: String(powerHash),
            tierType: 5,
            tierTypeName: 'Legendary',
          },
          perks: [],
          stats: {},
        },
      } as any,
      [HELMET_BUCKET]: {
        itemHash: exoticHelmetHash,
        instanceId: String(exoticHelmetHash),
        name: exoticHelmetName,
        details: {
          baseInfo: {
            name: exoticHelmetName,
            itemHash: exoticHelmetHash,
            instanceId: String(exoticHelmetHash),
            tierType: 6,
            tierTypeName: 'Exotic',
          },
          perks: [],
          stats: {},
        },
      } as any,
      [CHEST_BUCKET]: {
        itemHash: 5001n,
        instanceId: '6917529000000000099',
        name: legendaryChestName,
        details: {
          baseInfo: {
            name: legendaryChestName,
            itemHash: 5001n,
            instanceId: '6917529000000000099',
            tierType: 5,
            tierTypeName: 'Legendary',
          },
          perks: [],
          stats: {},
        },
      } as any,
    },
  };
}

describe('SimilarLoadoutsView', () => {
  const targetSnapshot = buildTestSnapshot({
    id: 'target-1',
    name: 'Defensive Dominant',
    exoticHelmetName: 'Wormhusk Crown',
    exoticHelmetHash: 1001n,
    legendaryChestName: 'Target Legendary Chest',
    powerName: 'Boomslang-4fr',
    powerHash: 3001n,
    healthStat: 170,
    superStat: 80,
  });

  const highCandidateSnapshot = buildTestSnapshot({
    id: 'cand-high',
    name: "Primed' Roaming Gamer Mode",
    exoticHelmetName: 'Wormhusk Crown',
    exoticHelmetHash: 1001n,
    legendaryChestName: 'Noisy Legendary Chest Piece A',
    powerName: 'Hammerhead',
    powerHash: 3002n,
    healthStat: 160,
    superStat: 90,
  });

  const baseCandidateSnapshot = buildTestSnapshot({
    id: 'cand-base',
    name: 'Passive Rapid',
    exoticHelmetName: 'St0mp-EE5',
    exoticHelmetHash: 1002n,
    legendaryChestName: 'Noisy Legendary Chest Piece B',
    powerName: 'Hammerhead',
    powerHash: 3002n,
    healthStat: 169,
    superStat: 85,
  });

  const mockItems: SimilarSnapshotItem[] = [
    {
      snapshot: highCandidateSnapshot,
      tier: 'high',
      exoticArmorMatch: true,
      powerWeaponMatch: false,
      statDiffs: { Health: -10, Super: 10 },
    },
    {
      snapshot: baseCandidateSnapshot,
      tier: 'base',
      exoticArmorMatch: false,
      powerWeaponMatch: false,
      statDiffs: { Health: -1, Super: 5 },
    },
  ];

  const mockStats: Record<string, PlayerStats> = {
    'target-1': {
      kills: { value: 200 },
      deaths: { value: 100 },
      kd: { value: 2.0 },
      standing: { value: 0.75 },
    },
    'cand-high': {
      kills: { value: 100 },
      deaths: { value: 100 },
      kd: { value: 1.0 },
      standing: { value: 0.5 },
    },
    'cand-base': {
      kills: { value: 60 },
      deaths: { value: 100 },
      kd: { value: 0.6 },
      standing: { value: 0.2 },
    },
  };

  const mockCounts: Record<string, number> = {
    'target-1': 20,
    'cand-high': 10,
    'cand-base': 10,
  };

  const mockInitialData: GetSimilarSnapshotsResponse = {
    target: targetSnapshot,
    items: mockItems,
    stats: mockStats,
    count: mockCounts,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('groups High Similarity and Base Similarity candidates accurately, toggles Select/Deselect All High label, and excludes Legendary armor buckets', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <SimilarLoadoutsView
            initialData={mockInitialData}
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByTestId('high-similarity-group')).toBeInTheDocument();
    expect(screen.getByTestId('base-similarity-group')).toBeInTheDocument();
    expect(screen.getByText('High Similarity (1)')).toBeInTheDocument();
    expect(screen.getByText('Base Similarity (1)')).toBeInTheDocument();

    expect(screen.getByText('Exotic Armor Match')).toBeInTheDocument();
    expect(screen.getByText('Exotic: St0mp-EE5')).toBeInTheDocument();
    expect(screen.getAllByText('Power: Hammerhead').length).toBe(2);
    expect(screen.getByText('Health -10')).toBeInTheDocument();
    expect(screen.getByText('Super +10')).toBeInTheDocument();

    const selectAllBtn = screen.getByRole('button', {
      name: 'Select All High Similarity',
    });
    fireEvent.click(selectAllBtn);
    expect(
      screen.getByRole('button', { name: 'Deselect All High Similarity' }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Deselect All High Similarity' }),
    );
    expect(
      screen.getByRole('button', { name: 'Select All High Similarity' }),
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Target Legendary Chest'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Noisy Legendary Chest Piece A'),
    ).not.toBeInTheDocument();
  });

  it('checking/unchecking multiple candidates updates the Live Combined Stats Preview', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <SimilarLoadoutsView
            initialData={mockInitialData}
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByTestId('combined-matches-value')).toHaveTextContent(
      '20',
    );
    expect(screen.getByTestId('combined-winrate-value')).toHaveTextContent(
      '75%',
    );
    expect(screen.getByTestId('combined-kd-value')).toHaveTextContent('2.00');

    const highCheckbox = screen.getByRole('checkbox', {
      name: /select primed' roaming gamer mode/i,
    });
    fireEvent.click(highCheckbox);

    expect(screen.getByTestId('combined-matches-value')).toHaveTextContent(
      '30',
    );
    expect(screen.getByTestId('combined-winrate-value')).toHaveTextContent(
      '67%',
    );
    expect(screen.getByTestId('combined-kd-value')).toHaveTextContent('1.50');

    const baseCheckbox = screen.getByRole('checkbox', {
      name: /select passive rapid/i,
    });
    fireEvent.click(baseCheckbox);

    expect(screen.getByTestId('combined-matches-value')).toHaveTextContent(
      '40',
    );
    expect(screen.getByTestId('combined-winrate-value')).toHaveTextContent(
      '55%',
    );
    expect(screen.getByTestId('combined-kd-value')).toHaveTextContent('1.20');
  });

  it('renders a "View Loadout" link on each candidate pointing to that candidate loadout page', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <SimilarLoadoutsView
            initialData={mockInitialData}
            userId="user-1"
            characterId="char-1"
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(
      screen.queryByRole('button', { name: /swap primary/i }),
    ).not.toBeInTheDocument();

    const viewLinks = screen.getAllByRole('link', { name: /view loadout/i });
    expect(viewLinks).toHaveLength(2);
    expect(viewLinks[0]).toHaveAttribute(
      'href',
      '/profile/user-1/c/char-1/loadouts/cand-high',
    );
    expect(viewLinks[1]).toHaveAttribute(
      'href',
      '/profile/user-1/c/char-1/loadouts/cand-base',
    );
  });

  it('submitting all candidates merges into the primary target and navigates to its overview page', async () => {
    let submittedFormData: FormData | null = null;

    const router = createMemoryRouter(
      [
        {
          path: '/profile/:id/c/:characterId/loadouts/:snapshotId/similar',
          element: (
            <SimilarLoadoutsView
              initialData={mockInitialData}
              userId="user-1"
              characterId="char-1"
            />
          ),
        },
        {
          path: '/profile/:id/c/:characterId/loadouts/:snapshotId',
          element: <div>Target Loadout Overview</div>,
        },
        {
          path: '/action/merge-loadout',
          action: async ({ request }) => {
            submittedFormData = await request.formData();
            return { ok: true };
          },
        },
      ],
      {
        initialEntries: ['/profile/user-1/c/char-1/loadouts/target-1/similar'],
      },
    );

    render(<RouterProvider router={router} />);

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /select primed' roaming gamer mode/i,
      }),
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /select passive rapid/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /merge selected \(2\)/i }),
    );

    await waitFor(() => {
      expect(submittedFormData).not.toBeNull();
    });

    expect(submittedFormData!.get('baseLoadoutId')).toBe('target-1');
    expect(submittedFormData!.getAll('sourceSnapshotIds')).toEqual([
      'cand-high',
      'cand-base',
    ]);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        '/profile/user-1/c/char-1/loadouts/target-1',
      );
    });
  });

  it('shows merge progress banner while in flight and renders inline error alert on failure', async () => {
    let resolveMerge!: (val: { ok: boolean; error?: string }) => void;

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <SimilarLoadoutsView
            initialData={mockInitialData}
          />
        ),
      },
      {
        path: '/action/merge-loadout',
        action: () =>
          new Promise<{ ok: boolean; error?: string }>((resolve) => {
            resolveMerge = resolve;
          }),
      },
    ]);

    render(<RouterProvider router={router} />);

    const highCheckbox = screen.getByRole('checkbox', {
      name: /select primed' roaming gamer mode/i,
    });
    fireEvent.click(highCheckbox);

    fireEvent.click(
      screen.getByRole('button', { name: /merge selected \(1\)/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('merge-progress-banner')).toBeInTheDocument();
    });

    expect(highCheckbox).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /merging \(1\)\.\.\./i }),
    ).toBeDisabled();

    resolveMerge({ ok: false, error: 'Backend temporarily unavailable' });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Backend temporarily unavailable',
      );
    });
    expect(highCheckbox).toBeChecked();
  });
});
