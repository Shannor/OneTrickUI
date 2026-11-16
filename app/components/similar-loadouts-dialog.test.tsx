import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type CharacterSnapshot,
  type PlayerStats,
  type SimilarSnapshotItem,
  getSimilarSnapshots,
} from '~/api';
import {
  CHEST_BUCKET,
  ENERGY_BUCKET,
  HELMET_BUCKET,
  KINETIC_BUCKET,
  POWER_BUCKET,
  SUBCLASS_BUCKET,
} from '~/hooks/use-loadout';

import { SimilarLoadoutsDialog } from './similar-loadouts-dialog';

vi.mock('~/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api')>();
  return {
    ...actual,
    getSimilarSnapshots: vi.fn(),
  };
});

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

describe('SimilarLoadoutsDialog', () => {
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
      standing: { value: 0.75 }, // 15 wins in 20 games
    },
    'cand-high': {
      kills: { value: 100 },
      deaths: { value: 100 },
      kd: { value: 1.0 },
      standing: { value: 0.5 }, // 5 wins in 10 games
    },
    'cand-base': {
      kills: { value: 60 },
      deaths: { value: 100 },
      kd: { value: 0.6 },
      standing: { value: 0.2 }, // 2 wins in 10 games
    },
  };

  const mockCounts: Record<string, number> = {
    'target-1': 20,
    'cand-high': 10,
    'cand-base': 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSimilarSnapshots).mockResolvedValue({
      data: {
        target: targetSnapshot,
        items: mockItems,
        stats: mockStats,
        count: mockCounts,
      },
      error: undefined,
    } as any);
  });

  it('groups High Similarity and Base Similarity candidates accurately and renders only Exotic Armor, Class Stat deltas, and Power weapon diffs (ignoring Legendary armor buckets)', async () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <SimilarLoadoutsDialog
            snapshotId="target-1"
            isOpen={true}
            onOpenChange={vi.fn()}
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('high-similarity-group')).toBeInTheDocument();
    });

    expect(screen.getByTestId('base-similarity-group')).toBeInTheDocument();
    expect(screen.getByText('High Similarity (1)')).toBeInTheDocument();
    expect(screen.getByText('Base Similarity (1)')).toBeInTheDocument();

    // Verify focused diffs are rendered
    expect(screen.getByText('Exotic Armor Match')).toBeInTheDocument();
    expect(screen.getByText('Exotic: St0mp-EE5')).toBeInTheDocument();
    expect(screen.getAllByText('Power: Hammerhead').length).toBe(2);
    expect(screen.getByText('Health -10')).toBeInTheDocument();
    expect(screen.getByText('Super +10')).toBeInTheDocument();

    // Verify Legendary armor pieces are NOT rendered anywhere in the modal
    expect(
      screen.queryByText('Target Legendary Chest'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Noisy Legendary Chest Piece A'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Noisy Legendary Chest Piece B'),
    ).not.toBeInTheDocument();
  });

  it('checking/unchecking multiple candidates updates the Live Combined Stats Preview (total matches, weighted KD, weighted Win Rate)', async () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <SimilarLoadoutsDialog
            snapshotId="target-1"
            isOpen={true}
            onOpenChange={vi.fn()}
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('combined-matches-value')).toHaveTextContent(
        '20',
      );
    });
    expect(screen.getByTestId('combined-winrate-value')).toHaveTextContent(
      '75%',
    );
    expect(screen.getByTestId('combined-kd-value')).toHaveTextContent('2.00');

    // Check high similarity candidate (+10 games, 5 wins, 100 kills / 100 deaths)
    // Total: 30 games, 20 wins (67%), 300 kills / 200 deaths (1.50 KD)
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

    // Check base similarity candidate (+10 games, 2 wins, 60 kills / 100 deaths)
    // Total: 40 games, 22 wins (55%), 360 kills / 300 deaths (1.20 KD)
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

    // Uncheck high similarity candidate -> Target + Base = 30 games, 17 wins (57%), 260/200 = 1.30 KD
    fireEvent.click(highCheckbox);
    expect(screen.getByTestId('combined-matches-value')).toHaveTextContent(
      '30',
    );
    expect(screen.getByTestId('combined-winrate-value')).toHaveTextContent(
      '57%',
    );
    expect(screen.getByTestId('combined-kd-value')).toHaveTextContent('1.30');
  });

  it('clicking "Swap Primary" updates the active target and recalculates diffs', async () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <SimilarLoadoutsDialog
            snapshotId="target-1"
            isOpen={true}
            onOpenChange={vi.fn()}
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('primary-loadout-header')).toHaveTextContent(
        'Defensive Dominant',
      );
    });

    // Click Swap Primary on highCandidateSnapshot ("Primed' Roaming Gamer Mode")
    const swapButtons = screen.getAllByRole('button', {
      name: /swap primary/i,
    });
    fireEvent.click(swapButtons[0]);

    // Primary header now shows "Primed' Roaming Gamer Mode" (Health: 160, Super: 90)
    expect(screen.getByTestId('primary-loadout-header')).toHaveTextContent(
      "Primed' Roaming Gamer Mode",
    );

    // Old target ("Defensive Dominant", Health: 170, Super: 80) is now a candidate with inverted statDiffs: Health +10, Super -10
    expect(screen.getByTestId('similar-candidate-target-1')).toHaveTextContent(
      'Defensive Dominant',
    );
    expect(screen.getByText('Health +10')).toBeInTheDocument();
    expect(screen.getByText('Super -10')).toBeInTheDocument();
  });

  it('submitting posts sourceSnapshotIds and navigates to newTargetId when primary was swapped on a detail page', async () => {
    let submittedFormData: FormData | null = null;
    const onOpenChange = vi.fn();

    const router = createMemoryRouter(
      [
        {
          path: '/profile/:id/c/:characterId/loadouts/:snapshotId',
          element: (
            <SimilarLoadoutsDialog
              snapshotId="target-1"
              isOpen={true}
              onOpenChange={onOpenChange}
              userId="user-1"
              characterId="char-1"
              isDetailPage={true}
            />
          ),
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
        initialEntries: ['/profile/user-1/c/char-1/loadouts/target-1'],
      },
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('primary-loadout-header')).toHaveTextContent(
        'Defensive Dominant',
      );
    });

    // Swap Primary to cand-high
    const swapButtons = screen.getAllByRole('button', {
      name: /swap primary/i,
    });
    fireEvent.click(swapButtons[0]);

    // Select both remaining candidates (target-1 and cand-base)
    fireEvent.click(
      screen.getByRole('checkbox', { name: /select defensive dominant/i }),
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /select passive rapid/i }),
    );

    // Submit batch merge
    const mergeButton = screen.getByRole('button', {
      name: /merge selected \(2\)/i,
    });
    fireEvent.click(mergeButton);

    await waitFor(() => {
      expect(submittedFormData).not.toBeNull();
    });

    expect(submittedFormData!.get('baseLoadoutId')).toBe('cand-high');
    expect(submittedFormData!.getAll('sourceSnapshotIds')).toEqual([
      'target-1',
      'cand-base',
    ]);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        '/profile/user-1/c/char-1/loadouts/cand-high',
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows merge progress banner and disables controls while a slow merge is in flight', async () => {
    let resolveMerge!: (val: { ok: boolean }) => void;
    const onOpenChange = vi.fn();

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <SimilarLoadoutsDialog
            snapshotId="target-1"
            isOpen={true}
            onOpenChange={onOpenChange}
          />
        ),
      },
      {
        path: '/action/merge-loadout',
        action: () =>
          new Promise<{ ok: boolean }>((resolve) => {
            resolveMerge = resolve;
          }),
      },
    ]);

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('primary-loadout-header')).toHaveTextContent(
        'Defensive Dominant',
      );
    });

    const highCheckbox = screen.getByRole('checkbox', {
      name: /select primed' roaming gamer mode/i,
    });
    fireEvent.click(highCheckbox);

    const mergeButton = screen.getByRole('button', {
      name: /merge selected \(1\)/i,
    });
    fireEvent.click(mergeButton);

    await waitFor(() => {
      expect(screen.getByTestId('merge-progress-banner')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /merging 1 loadout and reassigning match history across all sessions/i,
      ),
    ).toBeInTheDocument();
    expect(highCheckbox).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /merging \(1\)\.\.\./i }),
    ).toBeDisabled();

    resolveMerge({ ok: true });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

