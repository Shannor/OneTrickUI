import { describe, expect, it } from 'vitest';
import type {
  CharacterSnapshot,
  GetSimilarSnapshotsResponse,
  ItemSnapshot,
  Loadout,
} from '~/api';
import {
  getExoticCatalystState,
  isEnhancedWeapon,
} from '~/lib/weapon-enhancement';

import {
  CHEST_BUCKET,
  CLASS_ARMOR_BUCKET,
  ENERGY_BUCKET,
  GAUNTLETS_BUCKET,
  HELMET_BUCKET,
  type ItemSnapshotWithLegacyProps,
  KINETIC_BUCKET,
  LEG_BUCKET,
  POWER_BUCKET,
  SUBCLASS_BUCKET,
  buildDimSearchQuery,
  slimSimilarSnapshotPage,
  slimSnapshotForCard,
} from './use-loadout';

function makeItem(
  itemHash: number,
  instanceId = '',
  detailsInstanceId?: string,
): ItemSnapshot {
  return {
    itemHash: BigInt(itemHash),
    instanceId,
    name: `Item ${itemHash}`,
    details: {
      baseInfo: {
        bucketHash: 0n,
        icon: '',
        instanceId: detailsInstanceId ?? instanceId,
        itemHash: BigInt(itemHash),
        itemTypeAndTierDisplayName: '',
        itemTypeDisplayName: '',
        name: `Item ${itemHash}`,
        tierType: 5,
        tierTypeName: 'Legendary',
      },
      stats: {},
      perks: [],
      sockets: [],
    },
  };
}

describe('buildDimSearchQuery', () => {
  it('returns an empty string when loadout is undefined or empty', () => {
    expect(buildDimSearchQuery(undefined)).toBe('');
    expect(buildDimSearchQuery({})).toBe('');
  });

  it('extracts valid instanceIds for all 3 weapon buckets and 5 armor buckets in order and ignores subclass', () => {
    const loadout: Loadout = {
      [SUBCLASS_BUCKET]: makeItem(3284755031, '9999999999999999999'),
      [CLASS_ARMOR_BUCKET]: makeItem(1008, '6917530200000000008'),
      [LEG_BUCKET]: makeItem(1007, '6917530200000000007'),
      [CHEST_BUCKET]: makeItem(1006, '6917530200000000006'),
      [GAUNTLETS_BUCKET]: makeItem(1005, '6917530200000000005'),
      [HELMET_BUCKET]: makeItem(1004, '6917530200000000004'),
      [POWER_BUCKET]: makeItem(1003, '6917530200000000003'),
      [ENERGY_BUCKET]: makeItem(1002, '6917530200000000002'),
      [KINETIC_BUCKET]: makeItem(1001, '6917530200000000001'),
    };

    expect(buildDimSearchQuery(loadout)).toBe(
      [
        "(id:'6917530200000000001')",
        "(id:'6917530200000000002')",
        "(id:'6917530200000000003')",
        "(id:'6917530200000000004')",
        "(id:'6917530200000000005')",
        "(id:'6917530200000000006')",
        "(id:'6917530200000000007')",
        "(id:'6917530200000000008')",
      ].join(' OR '),
    );
  });

  it('filters out empty strings, "0", and fallback values equal to String(item.itemHash)', () => {
    const loadout: Loadout = {
      [KINETIC_BUCKET]: makeItem(1111, ''),
      [ENERGY_BUCKET]: makeItem(2222, '0', '0'),
      [POWER_BUCKET]: makeItem(3333, '3333', '3333'),
      [HELMET_BUCKET]: makeItem(4444, '6917530200672292224'),
    };

    expect(buildDimSearchQuery(loadout)).toBe("(id:'6917530200672292224')");
  });

  it('uses effectiveInstanceId when top-level instanceId falls back to itemHash', () => {
    const legacyArmorItem: ItemSnapshotWithLegacyProps = {
      ...makeItem(5555, '5555', '5555'),
      itemProperties: {
        baseInfo: {
          instanceId: '6917530199974468997',
        },
      },
    };

    const loadout: Loadout = {
      [KINETIC_BUCKET]: makeItem(1111, '1111', '6917530200672292224'),
      [HELMET_BUCKET]: legacyArmorItem,
    };

    expect(buildDimSearchQuery(loadout)).toBe(
      "(id:'6917530200672292224') OR (id:'6917530199974468997')",
    );
  });
});

describe('slimSnapshotForCard & slimSimilarSnapshotPage', () => {
  it('preserves a single minimal enhanced socket on enhanced weapons while stripping non-enhanced sockets', () => {
    const enhancedKinetic = makeItem(1001, '6917530200000000001');
    enhancedKinetic.details.baseInfo.bucketHash = BigInt(KINETIC_BUCKET);
    enhancedKinetic.details.sockets = [
      {
        plugHash: 11,
        name: 'Smallbore',
        description: 'Verbose barrel description',
        icon: '/smallbore.png',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: 'Barrel',
      },
      {
        plugHash: 12,
        name: 'Slideshot',
        description: 'Verbose enhanced perk description',
        icon: '/slideshot.png',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: 'Enhanced Trait',
        itemTypeTieredDisplayName: 'Common Enhanced Trait',
      },
      {
        plugHash: 13,
        name: 'Opening Shot',
        description: 'Another enhanced perk description',
        icon: '/opening-shot.png',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: 'Enhanced Trait',
        itemTypeTieredDisplayName: 'Common Enhanced Trait',
      },
    ];

    const baseEnergy = makeItem(1002, '6917530200000000002');
    baseEnergy.details.baseInfo.bucketHash = BigInt(ENERGY_BUCKET);
    baseEnergy.details.sockets = [
      {
        plugHash: 21,
        name: 'Threat Detector',
        description: 'Base perk description',
        icon: '/td.png',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: 'Trait',
      },
    ];

    const exoticArmor = makeItem(1004, '6917530200000000004');
    exoticArmor.details.baseInfo.bucketHash = BigInt(HELMET_BUCKET);
    exoticArmor.details.baseInfo.tierType = 6;
    exoticArmor.details.baseInfo.tierTypeName = 'Exotic';
    exoticArmor.details.sockets = [
      {
        plugHash: 41,
        name: 'Tier 5 Upgrade',
        description: 'Armor tier',
        icon: '/tier5.png',
        isEnabled: true,
        isVisible: false,
        itemTypeDisplayName: '',
      },
    ];

    const snapshot = {
      id: 'snap-1',
      name: 'Enhanced Loadout',
      loadout: {
        [KINETIC_BUCKET]: enhancedKinetic,
        [ENERGY_BUCKET]: baseEnergy,
        [HELMET_BUCKET]: exoticArmor,
      },
    } as unknown as CharacterSnapshot;

    const slimmed = slimSnapshotForCard(snapshot);
    const slimKinetic = slimmed.loadout?.[KINETIC_BUCKET];
    const slimEnergy = slimmed.loadout?.[ENERGY_BUCKET];
    const slimArmor = slimmed.loadout?.[HELMET_BUCKET];

    expect(slimKinetic?.details?.sockets).toEqual([
      {
        plugHash: 12,
        name: 'Slideshot',
        description: '',
        icon: '',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: 'Enhanced Trait',
        itemTypeTieredDisplayName: 'Common Enhanced Trait',
      },
    ]);
    expect(isEnhancedWeapon(slimKinetic)).toBe(true);

    expect(slimEnergy?.details?.sockets).toEqual([]);
    expect(isEnhancedWeapon(slimEnergy)).toBe(false);

    expect(slimArmor?.details?.sockets).toEqual([]);
    expect(isEnhancedWeapon(slimArmor)).toBe(false);

    const similarPage = slimSimilarSnapshotPage({
      target: snapshot,
      items: [{ snapshot, similarity: 0.95 }],
    } as unknown as GetSimilarSnapshotsResponse);

    expect(isEnhancedWeapon(similarPage.target.loadout?.[KINETIC_BUCKET])).toBe(
      true,
    );
    expect(
      isEnhancedWeapon(similarPage.items[0].snapshot.loadout?.[KINETIC_BUCKET]),
    ).toBe(true);
  });

  it('preserves minimal active and empty Exotic catalyst marker sockets in slimmed snapshots', () => {
    const activeCatalystExotic = makeItem(2001, '6917530200000000011');
    activeCatalystExotic.details.baseInfo.bucketHash = BigInt(KINETIC_BUCKET);
    activeCatalystExotic.details.baseInfo.tierType = 6;
    activeCatalystExotic.details.baseInfo.tierTypeName = 'Exotic';
    activeCatalystExotic.details.sockets = [
      {
        plugHash: 101,
        name: 'Memento Mori',
        description: 'Intrinsic perk',
        icon: '/intrinsic.png',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: 'Intrinsic',
      },
      {
        plugHash: 3947093900,
        name: 'Ace of Spades Catalyst',
        description: 'Verbose catalyst description',
        icon: '/ace-catalyst.png',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: '',
      },
    ];

    const emptyCatalystExotic = makeItem(2002, '6917530200000000012');
    emptyCatalystExotic.details.baseInfo.bucketHash = BigInt(POWER_BUCKET);
    emptyCatalystExotic.details.baseInfo.tierType = 6;
    emptyCatalystExotic.details.baseInfo.tierTypeName = 'Exotic';
    emptyCatalystExotic.details.sockets = [
      {
        plugHash: 1498917124,
        name: 'Empty Catalyst Socket',
        description: 'Empty slot',
        icon: '/empty.png',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: '',
      },
    ];

    const snapshot = {
      id: 'snap-catalyst',
      name: 'Exotic Catalyst Loadout',
      loadout: {
        [KINETIC_BUCKET]: activeCatalystExotic,
        [POWER_BUCKET]: emptyCatalystExotic,
      },
    } as unknown as CharacterSnapshot;

    const slimmed = slimSnapshotForCard(snapshot);
    const slimKinetic = slimmed.loadout?.[KINETIC_BUCKET];
    const slimPower = slimmed.loadout?.[POWER_BUCKET];

    expect(slimKinetic?.details?.sockets).toEqual([
      {
        plugHash: 3947093900,
        name: 'Ace of Spades Catalyst',
        description: '',
        icon: '',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: '',
        itemTypeTieredDisplayName: '',
      },
    ]);
    expect(getExoticCatalystState(slimKinetic)).toBe('active');

    expect(slimPower?.details?.sockets).toEqual([
      {
        plugHash: 1498917124,
        name: 'Empty Catalyst Socket',
        description: '',
        icon: '',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: '',
        itemTypeTieredDisplayName: '',
      },
    ]);
    expect(getExoticCatalystState(slimPower)).toBe('empty');

    const similarPage = slimSimilarSnapshotPage({
      target: snapshot,
      items: [{ snapshot, similarity: 0.9 }],
    } as unknown as GetSimilarSnapshotsResponse);

    expect(
      getExoticCatalystState(similarPage.target.loadout?.[KINETIC_BUCKET]),
    ).toBe('active');
    expect(
      getExoticCatalystState(
        similarPage.items[0].snapshot.loadout?.[POWER_BUCKET],
      ),
    ).toBe('empty');
  });
});
