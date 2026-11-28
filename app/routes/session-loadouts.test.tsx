import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CharacterSnapshot } from '~/api';
import { MergeLoadoutDialog } from '~/components/merge-loadout-dialog';
import {
  ENERGY_BUCKET,
  KINETIC_BUCKET,
  SUBCLASS_BUCKET,
  areSnapshotsCompatible,
  effectiveInstanceId,
} from '~/hooks/use-loadout';

import SessionLoadouts from './session-loadouts';

const mockUseSessionData = vi.fn();
const mockUseProfileData = vi.fn();

vi.mock('~/hooks/use-route-loaders', () => ({
  useSessionData: () => mockUseSessionData(),
  useProfileData: () => mockUseProfileData(),
}));

vi.mock('~/components/condensed-loadout', () => ({
  CondensedLoadout: ({ snapshot }: { snapshot: CharacterSnapshot }) => (
    <div data-testid={`condensed-${snapshot.id}`}>{snapshot.name}</div>
  ),
}));

function makeSnapshot({
  id,
  name,
  kineticInstanceId = '6917529000000000001',
  kineticTopInstanceId,
  kineticUseItemProperties = false,
  energyInstanceId = '6917529000000000002',
  subclassHash = 3284755031n,
}: {
  id: string;
  name: string;
  kineticInstanceId?: string;
  kineticTopInstanceId?: string;
  kineticUseItemProperties?: boolean;
  energyInstanceId?: string;
  subclassHash?: bigint;
}): CharacterSnapshot {
  const kineticHash = 111111n;
  const energyHash = 222222n;

  const kineticItem: any = {
    itemHash: kineticHash,
    instanceId: kineticTopInstanceId ?? kineticInstanceId,
    name: 'Rose',
    details: {
      baseInfo: {
        name: 'Rose',
        itemHash: kineticHash,
        instanceId: kineticUseItemProperties
          ? String(kineticHash)
          : kineticInstanceId,
        tierType: 5,
        tierTypeName: 'Legendary',
      },
      perks: [],
      stats: {},
    },
  };

  if (kineticUseItemProperties) {
    kineticItem.itemProperties = {
      baseInfo: {
        instanceId: kineticInstanceId,
      },
    };
  }

  return {
    id,
    name,
    userId: 'user-1',
    characterId: 'char-1',
    hash: `hash-${id}`,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    loadout: {
      [KINETIC_BUCKET]: kineticItem,
      [ENERGY_BUCKET]: {
        itemHash: energyHash,
        instanceId: energyInstanceId,
        name: 'Matador 64',
        details: {
          baseInfo: {
            name: 'Matador 64',
            itemHash: energyHash,
            instanceId: energyInstanceId,
            tierType: 5,
            tierTypeName: 'Legendary',
          },
          perks: [],
          stats: {},
        },
      } as any,
      [SUBCLASS_BUCKET]: {
        itemHash: subclassHash,
        instanceId: String(subclassHash),
        name: 'Solar Hunter',
        details: {
          baseInfo: {
            name: 'Solar Hunter',
            itemHash: subclassHash,
            instanceId: String(subclassHash),
            tierType: 2,
            tierTypeName: 'Basic',
          },
          perks: [],
          stats: {},
        },
      } as any,
    },
  };
}

describe('effectiveInstanceId & SessionLoadouts compatibility filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfileData.mockReturnValue({
      type: 'owner',
      profile: { id: 'user-1' },
    });
  });

  it('effectiveInstanceId matches across server-tick and backend snapshot shapes', () => {
    // server-tick shape: top-level instanceId is String(itemHash), real 64-bit ID on itemProperties.baseInfo.instanceId
    const serverTickSnap = makeSnapshot({
      id: 'snap-tick',
      name: 'Server Tick Loadout',
      kineticInstanceId: '6917529999999999999',
      kineticTopInstanceId: '111111',
      kineticUseItemProperties: true,
    });

    // backend shape: 64-bit ID on both top-level and details.baseInfo.instanceId
    const backendSnap = makeSnapshot({
      id: 'snap-backend',
      name: 'Backend Loadout',
      kineticInstanceId: '6917529999999999999',
      kineticTopInstanceId: '6917529999999999999',
    });

    expect(effectiveInstanceId(serverTickSnap.loadout[KINETIC_BUCKET])).toBe(
      '6917529999999999999',
    );
    expect(effectiveInstanceId(backendSnap.loadout[KINETIC_BUCKET])).toBe(
      '6917529999999999999',
    );
    expect(areSnapshotsCompatible(serverTickSnap, backendSnap)).toBe(true);
  });

  it('excludes loadouts with different Subclass or weapons and disables Merge button when none are compatible', () => {
    const baseSnap = makeSnapshot({
      id: 'snap-1',
      name: 'Solar Rose Loadout',
    });
    const compatibleSnap = makeSnapshot({
      id: 'snap-2',
      name: 'Solar Rose Variant',
    });
    const differentSubclassSnap = makeSnapshot({
      id: 'snap-3',
      name: 'Void Rose Loadout',
      subclassHash: 999999999n,
    });

    mockUseSessionData.mockReturnValue({
      snapshots: {
        'snap-1': baseSnap,
        'snap-2': compatibleSnap,
        'snap-3': differentSubclassSnap,
      },
    });

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <SessionLoadouts
            {...({
              params: {
                id: 'user-1',
                characterId: 'char-1',
                sessionId: 'sess-1',
              },
            } as any)}
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    const mergeButtons = screen.getAllByRole('button', {
      name: /merge loadout/i,
    });
    // snap-1 and snap-2 are compatible with each other -> enabled
    expect(mergeButtons[0]).not.toBeDisabled();
    expect(mergeButtons[1]).not.toBeDisabled();
    // snap-3 has a different subclass -> no compatible loadouts -> disabled
    expect(mergeButtons[2]).toBeDisabled();
  });

  it('keeps MergeLoadoutDialog open and renders error message when merge action returns { ok: false, error }', async () => {
    const baseSnap = makeSnapshot({
      id: 'snap-1',
      name: 'Primary Session Loadout',
    });
    const compatibleSnap = makeSnapshot({
      id: 'snap-2',
      name: 'Duplicate Session Loadout',
    });
    const incompatibleWeaponSnap = makeSnapshot({
      id: 'snap-3',
      name: 'Different Weapon Loadout',
      kineticInstanceId: '6917529888888888888',
    });

    const onOpenChange = vi.fn();

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <MergeLoadoutDialog
            isOpen={true}
            onOpenChange={onOpenChange}
            baseSnapshot={baseSnap}
            availableSnapshots={[
              baseSnap,
              compatibleSnap,
              incompatibleWeaponSnap,
            ]}
          />
        ),
      },
      {
        path: '/action/merge-loadout',
        action: async () => ({
          ok: false,
          error: 'Failed to merge: incompatible subclass',
        }),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(
      screen.getByText('Merge with Primary Session Loadout'),
    ).toBeInTheDocument();

    // Submit the form inside dialog
    const submitBtn = screen.getByRole('button', { name: /confirm merge/i });
    const form = submitBtn.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to merge: incompatible subclass',
      );
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('does not immediately auto-close when opened a second time after a successful merge', async () => {
    const snapA = makeSnapshot({ id: 'snap-a', name: 'Session Loadout A' });
    const snapB = makeSnapshot({ id: 'snap-b', name: 'Session Loadout B' });
    const snapC = makeSnapshot({ id: 'snap-c', name: 'Session Loadout C' });

    mockUseSessionData.mockReturnValue({
      snapshots: {
        'snap-a': snapA,
        'snap-b': snapB,
        'snap-c': snapC,
      },
    });

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <SessionLoadouts
            {...({
              params: {
                id: 'user-1',
                characterId: 'char-1',
                sessionId: 'sess-1',
              },
            } as any)}
          />
        ),
      },
      {
        path: '/action/merge-loadout',
        action: async () => ({ ok: true }),
      },
    ]);

    render(<RouterProvider router={router} />);

    // Open MergeLoadoutDialog on snap-a and submit a successful merge
    const mergeButtons = screen.getAllByRole('button', {
      name: /merge loadout/i,
    });
    fireEvent.click(mergeButtons[0]);

    expect(
      screen.getByText('Merge with Session Loadout A'),
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /confirm merge/i });
    expect(submitBtn).toBeDisabled();

    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(
        screen.queryByText('Merge with Session Loadout A'),
      ).not.toBeInTheDocument();
    });

    // Now open MergeLoadoutDialog on snap-b — it must stay open!
    fireEvent.click(
      screen.getAllByRole('button', { name: /merge loadout/i })[1],
    );

    expect(
      screen.getByText('Merge with Session Loadout B'),
    ).toBeInTheDocument();
  });

  it('excludes hydrated fireteam companion snapshots belonging to other characters', () => {
    const ownerSnap = makeSnapshot({ id: 'snap-owner', name: 'Owner Loadout' });
    const companionSnap: CharacterSnapshot = {
      ...makeSnapshot({
        id: 'snap-companion',
        name: 'Companion Titan Loadout',
      }),
      userId: 'user-tragic',
      characterId: 'char-tragic',
    };

    mockUseSessionData.mockReturnValue({
      snapshots: {
        'snap-owner': ownerSnap,
        'snap-companion': companionSnap,
      },
    });

    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <SessionLoadouts
            {...({
              params: {
                id: 'user-1',
                characterId: 'char-1',
                sessionId: 'sess-1',
              },
            } as any)}
          />
        ),
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', { name: 'Owner Loadout' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Companion Titan Loadout' }),
    ).not.toBeInTheDocument();
  });
});
