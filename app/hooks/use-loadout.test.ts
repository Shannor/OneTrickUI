import { describe, expect, it } from 'vitest';
import type { ItemSnapshot, Loadout } from '~/api';

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
