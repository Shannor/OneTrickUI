import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ArmorSetBonus,
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
  armorSetBonuses,
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
  armorSetBonuses?: ArmorSetBonus[];
}): CharacterSnapshot {
  return {
    id,
    name,
    userId: 'user-1',
    characterId: 'char-1',
    hash: `hash-${id}`,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    armorSetBonuses,
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
      armorSetBonusMatch: true,
      statDiffs: { Health: -10, Super: 10 },
    },
    {
      snapshot: baseCandidateSnapshot,
      tier: 'base',
      exoticArmorMatch: false,
      powerWeaponMatch: false,
      armorSetBonusMatch: true,
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
        element: <SimilarLoadoutsView initialData={mockInitialData} />,
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
        element: <SimilarLoadoutsView initialData={mockInitialData} />,
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
      'cand-high,cand-base',
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
        element: <SimilarLoadoutsView initialData={mockInitialData} />,
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

  it('displays active Armor Set Bonuses on primary target header and renders match and diff badges on candidates', () => {
    const electrumFourPc: ArmorSetBonus = {
      setHash: 742845781n,
      setName: 'Cruel Electrum',
      activeCount: 4,
      activePerks: [
        {
          requiredSetCount: 2,
          hash: 2562518502n,
          name: 'Primary Survivor',
          description: 'Boosts Primary weapons when allies fall.',
          iconPath: '/icons/survivor.png',
        },
        {
          requiredSetCount: 4,
          hash: 2562518503n,
          name: 'Primary Phantom',
          description: 'Primary final blows hide you from radar.',
          iconPath: '/icons/phantom.png',
        },
      ],
    };

    const audaciaTwoPc: ArmorSetBonus = {
      setHash: 2618364783n,
      setName: 'Per Audacia',
      activeCount: 2,
      activePerks: [
        {
          requiredSetCount: 2,
          hash: 3091068916n,
          name: 'Primary Chain',
          description: 'Primary kills grant stacking mobility and range.',
          iconPath: '/icons/chain.png',
        },
      ],
    };

    const targetWithBonuses = buildTestSnapshot({
      id: 'target-bonuses',
      name: 'Electrum Main',
      armorSetBonuses: [electrumFourPc],
    });

    const matchingCandidate = buildTestSnapshot({
      id: 'cand-match',
      name: 'Electrum Twin',
      armorSetBonuses: [{ ...electrumFourPc, activeCount: 5 }],
    });

    const differingCandidate = buildTestSnapshot({
      id: 'cand-diff',
      name: 'Split Set Alt',
      armorSetBonuses: [
        {
          ...electrumFourPc,
          activeCount: 2,
          activePerks: [electrumFourPc.activePerks[0]],
        },
        audaciaTwoPc,
      ],
    });

    const noBonusCandidate = buildTestSnapshot({
      id: 'cand-none',
      name: 'Legacy Armor Alt',
      armorSetBonuses: [],
    });

    const dataWithBonuses: GetSimilarSnapshotsResponse = {
      target: targetWithBonuses,
      items: [
        {
          snapshot: matchingCandidate,
          tier: 'high',
          exoticArmorMatch: true,
          powerWeaponMatch: true,
          armorSetBonusMatch: true,
        },
        {
          snapshot: differingCandidate,
          tier: 'high',
          exoticArmorMatch: true,
          powerWeaponMatch: true,
          armorSetBonusMatch: false,
        },
        {
          snapshot: noBonusCandidate,
          tier: 'base',
          exoticArmorMatch: false,
          powerWeaponMatch: true,
          armorSetBonusMatch: false,
        },
      ],
      stats: {},
      count: {
        'target-bonuses': 12,
        'cand-match': 5,
        'cand-diff': 4,
        'cand-none': 3,
      },
    };

    const router = createMemoryRouter([
      {
        path: '/',
        element: <SimilarLoadoutsView initialData={dataWithBonuses} />,
      },
    ]);

    render(<RouterProvider router={router} />);

    const primaryBonuses = screen.getByTestId('primary-armor-set-bonuses');
    expect(primaryBonuses).toHaveTextContent('Cruel Electrum');
    expect(primaryBonuses).toHaveTextContent('(4pc)');

    const matchCard = screen.getByTestId('similar-candidate-cand-match');
    expect(matchCard).toHaveTextContent('Set Bonus Match');

    const diffCard = screen.getByTestId('similar-candidate-cand-diff');
    expect(diffCard).toHaveTextContent(
      'Set: Cruel Electrum (2pc) + Per Audacia (2pc)',
    );

    const noneCard = screen.getByTestId('similar-candidate-cand-none');
    expect(noneCard).toHaveTextContent('Set: None');
  });

  it('renders No Set Bonuses badge and comparison tooltips when primary has no set bonuses, with tap-to-toggle support', () => {
    const audaciaTwoPc: ArmorSetBonus = {
      setHash: 2618364783n,
      setName: 'Per Audacia',
      activeCount: 2,
      activePerks: [
        {
          requiredSetCount: 2,
          hash: 3091068916n,
          name: 'Primary Chain',
          description: 'Primary kills grant stacking mobility and range.',
          iconPath: '/icons/chain.png',
        },
      ],
    };

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <SimilarLoadoutsView
            initialData={{
              target: buildTestSnapshot({
                id: 'target-empty',
                name: 'No Set Target',
                armorSetBonuses: [],
              }),
              items: [
                {
                  snapshot: buildTestSnapshot({
                    id: 'cand-empty',
                    name: 'No Set Candidate',
                    armorSetBonuses: [],
                  }),
                  tier: 'high',
                  exoticArmorMatch: true,
                  powerWeaponMatch: true,
                  armorSetBonusMatch: true,
                },
                {
                  snapshot: buildTestSnapshot({
                    id: 'cand-active-vs-empty',
                    name: 'Active Set Candidate',
                    armorSetBonuses: [audaciaTwoPc],
                  }),
                  tier: 'base',
                  exoticArmorMatch: true,
                  powerWeaponMatch: true,
                  armorSetBonusMatch: false,
                },
              ],
              stats: {},
              count: {
                'target-empty': 8,
                'cand-empty': 4,
                'cand-active-vs-empty': 2,
              },
            }}
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    const primaryBonuses = screen.getByTestId('primary-armor-set-bonuses');
    expect(primaryBonuses).toHaveTextContent('No Set Bonus');
    expect(screen.queryByText(/Set Bonuses:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Class Stats:/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('combined-stats-preview')).not.toHaveClass(
      'rounded-md',
    );

    const bothNoneBadge = screen
      .getByTestId('similar-candidate-cand-empty')
      .querySelector(
        '[data-testid="armor-set-bonus-diff-badge"]',
      ) as HTMLElement;
    expect(bothNoneBadge.tagName).toBe('BUTTON');
    expect(bothNoneBadge).toHaveAttribute('type', 'button');
    expect(bothNoneBadge).toHaveTextContent('No Set Bonuses');

    fireEvent.pointerDown(bothNoneBadge);
    fireEvent.click(bothNoneBadge);
    expect(
      screen.getAllByText('Neither loadout has active Armor Set Bonuses')
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("This Loadout's Set Bonuses").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Primary Target's Set Bonuses"),
    ).not.toBeInTheDocument();

    fireEvent.pointerDown(bothNoneBadge);
    fireEvent.click(bothNoneBadge);
    expect(
      screen.queryByText('Neither loadout has active Armor Set Bonuses'),
    ).not.toBeInTheDocument();

    const activeVsEmptyBadge = screen
      .getByTestId('similar-candidate-cand-active-vs-empty')
      .querySelector(
        '[data-testid="armor-set-bonus-diff-badge"]',
      ) as HTMLElement;
    fireEvent.pointerDown(activeVsEmptyBadge);
    fireEvent.click(activeVsEmptyBadge);
    expect(
      screen.getAllByText('Active Armor Set Bonuses (Primary has none)').length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("This Loadout's Set Bonuses").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Primary Target's Set Bonuses").length,
    ).toBeGreaterThan(0);
  });

  it('renders matching, differing, and missing candidate comparison tooltips when primary has set bonuses', () => {
    const electrumFourPc: ArmorSetBonus = {
      setHash: 742845781n,
      setName: 'Cruel Electrum',
      activeCount: 4,
      activePerks: [
        {
          requiredSetCount: 2,
          hash: 2562518502n,
          name: 'Primary Survivor',
          description: 'Boosts Primary weapons when allies fall.',
          iconPath: '/icons/survivor.png',
        },
        {
          requiredSetCount: 4,
          hash: 2562518503n,
          name: 'Primary Phantom',
          description: 'Primary final blows hide you from radar.',
          iconPath: '/icons/phantom.png',
        },
      ],
    };

    const audaciaTwoPc: ArmorSetBonus = {
      setHash: 2618364783n,
      setName: 'Per Audacia',
      activeCount: 2,
      activePerks: [
        {
          requiredSetCount: 2,
          hash: 3091068916n,
          name: 'Primary Chain',
          description: 'Primary kills grant stacking mobility and range.',
          iconPath: '/icons/chain.png',
        },
      ],
    };

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <SimilarLoadoutsView
            initialData={{
              target: buildTestSnapshot({
                id: 'target-active',
                name: 'Electrum Target',
                armorSetBonuses: [electrumFourPc],
              }),
              items: [
                {
                  snapshot: buildTestSnapshot({
                    id: 'cand-match-tooltip',
                    name: 'Matching Set',
                    armorSetBonuses: [electrumFourPc],
                  }),
                  tier: 'high',
                  exoticArmorMatch: true,
                  powerWeaponMatch: true,
                  armorSetBonusMatch: true,
                },
                {
                  snapshot: buildTestSnapshot({
                    id: 'cand-diff-tooltip',
                    name: 'Differing Set',
                    armorSetBonuses: [audaciaTwoPc],
                  }),
                  tier: 'high',
                  exoticArmorMatch: true,
                  powerWeaponMatch: true,
                  armorSetBonusMatch: false,
                },
                {
                  snapshot: buildTestSnapshot({
                    id: 'cand-none-tooltip',
                    name: 'No Set vs Active Target',
                    armorSetBonuses: [],
                  }),
                  tier: 'base',
                  exoticArmorMatch: true,
                  powerWeaponMatch: true,
                  armorSetBonusMatch: false,
                },
              ],
              stats: {},
              count: {
                'target-active': 10,
                'cand-match-tooltip': 5,
                'cand-diff-tooltip': 3,
                'cand-none-tooltip': 2,
              },
            }}
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    const matchBadge = screen
      .getByTestId('similar-candidate-cand-match-tooltip')
      .querySelector(
        '[data-testid="armor-set-bonus-diff-badge"]',
      ) as HTMLElement;
    fireEvent.pointerDown(matchBadge);
    fireEvent.click(matchBadge);
    expect(
      screen.getAllByText(
        'Same Armor Set Bonuses as Primary (Cruel Electrum (4pc))',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("This Loadout's Set Bonuses").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Primary Target's Set Bonuses"),
    ).not.toBeInTheDocument();

    fireEvent.pointerDown(matchBadge);
    fireEvent.click(matchBadge);

    const diffBadge = screen
      .getByTestId('similar-candidate-cand-diff-tooltip')
      .querySelector(
        '[data-testid="armor-set-bonus-diff-badge"]',
      ) as HTMLElement;
    fireEvent.pointerDown(diffBadge);
    fireEvent.click(diffBadge);
    expect(
      screen.getAllByText(
        'Different Armor Set Bonuses than Primary (Cruel Electrum (4pc))',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("This Loadout's Set Bonuses").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Primary Target's Set Bonuses").length,
    ).toBeGreaterThan(0);

    fireEvent.pointerDown(diffBadge);
    fireEvent.click(diffBadge);

    const noneVsActiveBadge = screen
      .getByTestId('similar-candidate-cand-none-tooltip')
      .querySelector(
        '[data-testid="armor-set-bonus-diff-badge"]',
      ) as HTMLElement;
    fireEvent.pointerDown(noneVsActiveBadge);
    fireEvent.click(noneVsActiveBadge);
    expect(
      screen.getAllByText(
        'No active Armor Set Bonuses (Primary has Cruel Electrum (4pc))',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Primary Target's Set Bonuses").length,
    ).toBeGreaterThan(0);
  });

  it('does not leak a failed merge error alert when switching to another target loadout', async () => {
    const otherTarget = buildTestSnapshot({
      id: 'target-2',
      name: 'Second Target Loadout',
    });
    const otherData: GetSimilarSnapshotsResponse = {
      target: otherTarget,
      items: mockItems,
      stats: { ...mockStats, 'target-2': mockStats['target-1'] },
      count: { ...mockCounts, 'target-2': 12 },
    };

    function SwitchTargetHarness() {
      const [currentData, setCurrentData] = useState(mockInitialData);
      return (
        <>
          <button type="button" onClick={() => setCurrentData(otherData)}>
            Switch Target
          </button>
          <SimilarLoadoutsView initialData={currentData} />
        </>
      );
    }

    const router = createMemoryRouter([
      {
        path: '/',
        element: <SwitchTargetHarness />,
      },
      {
        path: '/action/merge-loadout',
        action: async () => ({
          ok: false,
          error: 'Merge failed for target 1',
        }),
      },
    ]);

    render(<RouterProvider router={router} />);

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /select primed' roaming gamer mode/i,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /merge selected \(1\)/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Merge failed for target 1',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /switch target/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
