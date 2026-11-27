import type {
  CharacterSnapshot,
  GetSimilarSnapshotsResponse,
  GunStat,
  InstancePerformance,
  ItemSnapshot,
  Loadout,
  Perk,
  Socket,
  UniqueStatValue,
} from '~/api';
import { calculatePercentage } from '~/calculations/precision';
import { getItemIconUrl } from '~/lib/utils';
import {
  findCatalystMarkerSocket,
  findEnhancedSocket,
  toSlimEnhancedSocket,
} from '~/lib/weapon-enhancement';

const PRECISION_KILLS_KEY = 'uniqueWeaponPrecisionKills';
const UNIQUE_KILLS_KEY = 'uniqueWeaponKills';

export const KINETIC_BUCKET = 1498876634;
export const ENERGY_BUCKET = 2465295065;
export const POWER_BUCKET = 953998645;
export const SUBCLASS_BUCKET = 3284755031;

export const HELMET_BUCKET = 3448274439;
export const GAUNTLETS_BUCKET = 3551918588;
export const CHEST_BUCKET = 14239492;
export const LEG_BUCKET = 20886954;
export const CLASS_ARMOR_BUCKET = 1585787867;

export const ARMOR_BUCKETS = [
  HELMET_BUCKET,
  GAUNTLETS_BUCKET,
  CHEST_BUCKET,
  LEG_BUCKET,
  CLASS_ARMOR_BUCKET,
] as const;

export const GEAR_BUCKETS = [
  KINETIC_BUCKET,
  ENERGY_BUCKET,
  POWER_BUCKET,
  ...ARMOR_BUCKETS,
] as const;

const Kinetic = KINETIC_BUCKET;
const Energy = ENERGY_BUCKET;
const Power = POWER_BUCKET;

const HelmetArmor = HELMET_BUCKET;
const GauntletsArmor = GAUNTLETS_BUCKET;
const ChestArmor = CHEST_BUCKET;
const LegArmor = LEG_BUCKET;
const ClassArmor = CLASS_ARMOR_BUCKET;

interface Stats {
  precisionKills: number;
  kills: number;
}

export type ItemSnapshotWithLegacyProps = ItemSnapshot & {
  itemProperties?: {
    baseInfo?: {
      instanceId?: string;
      tierType?: number;
      tierTypeName?: string;
    };
  };
};

export function effectiveInstanceId(
  item?: ItemSnapshotWithLegacyProps,
): string {
  if (!item) return '';
  const hashStr = item.itemHash ? String(item.itemHash) : '';
  const detailsBaseId = item.details?.baseInfo?.instanceId ?? '';
  const propsBaseId = item.itemProperties?.baseInfo?.instanceId ?? '';
  const baseId =
    detailsBaseId && detailsBaseId !== hashStr
      ? detailsBaseId
      : propsBaseId || detailsBaseId;
  const topId = item.instanceId ?? '';
  if (baseId && baseId !== hashStr) return baseId;
  if (topId && topId !== hashStr) return topId;
  return baseId || topId;
}

export function buildDimSearchQuery(loadout?: Loadout): string {
  if (!loadout) return '';

  const queries: string[] = [];
  for (const bucket of GEAR_BUCKETS) {
    const item = loadout[bucket];
    if (!item) continue;
    const id = effectiveInstanceId(item);
    if (!id || id === '0' || id === String(item.itemHash)) continue;
    queries.push(`(id:'${id}')`);
  }

  return queries.join(' OR ');
}

export function getSnapshotCompatibilityKey(
  snapshot?: CharacterSnapshot | null,
): string | null {
  if (!snapshot?.loadout) return null;

  const kineticId = effectiveInstanceId(snapshot.loadout[KINETIC_BUCKET]);
  if (!kineticId) return null;

  const energyId = effectiveInstanceId(snapshot.loadout[ENERGY_BUCKET]);
  if (!energyId) return null;

  const subclassHash = snapshot.loadout[SUBCLASS_BUCKET]?.itemHash;
  if (!subclassHash || String(subclassHash) === '0') return null;

  return `${kineticId}:${energyId}:${String(subclassHash)}`;
}

export function areSnapshotsCompatible(
  base?: CharacterSnapshot | null,
  candidate?: CharacterSnapshot | null,
): boolean {
  if (!base || !candidate || base.id === candidate.id) return false;
  const baseKey = getSnapshotCompatibilityKey(base);
  if (!baseKey) return false;
  return baseKey === getSnapshotCompatibilityKey(candidate);
}

export function groupSnapshotsByCompatibility(
  snapshots: CharacterSnapshot[],
): Record<string, CharacterSnapshot[]> {
  const groups = new Map<string, CharacterSnapshot[]>();

  for (const snapshot of snapshots) {
    const key = getSnapshotCompatibilityKey(snapshot);
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) {
      existing.push(snapshot);
    } else {
      groups.set(key, [snapshot]);
    }
  }

  const compatibleById: Record<string, CharacterSnapshot[]> = {};
  for (const snapshot of snapshots) {
    const key = getSnapshotCompatibilityKey(snapshot);
    if (!key) {
      compatibleById[snapshot.id] = [];
      continue;
    }
    const group = groups.get(key) ?? [];
    compatibleById[snapshot.id] = group.filter(
      (other) => other.id !== snapshot.id,
    );
  }

  return compatibleById;
}

export function isExoticItem(item?: ItemSnapshotWithLegacyProps): boolean {
  if (!item) return false;
  const baseInfo = item.details?.baseInfo ?? item.itemProperties?.baseInfo;
  if (!baseInfo) return false;
  return (
    baseInfo.tierType === 6 || baseInfo.tierTypeName?.toLowerCase() === 'exotic'
  );
}

export function getWeapons(loadout?: Loadout): ItemSnapshot[] {
  if (!loadout) {
    return [];
  }
  const kinetic = loadout[Kinetic];
  const energy = loadout[Energy];
  const power = loadout[Power];
  return [kinetic, energy, power].filter(Boolean) as ItemSnapshot[];
}

export function getExotic(loadout?: Loadout): {
  weapon?: ItemSnapshot;
  armor?: ItemSnapshot;
} {
  if (!loadout) {
    return {};
  }
  // Get weapons
  const kinetic = loadout[Kinetic];
  const energy = loadout[Energy];
  const power = loadout[Power];

  // Get armor
  const helmet = loadout[HelmetArmor];
  const gauntlets = loadout[GauntletsArmor];
  const chest = loadout[ChestArmor];
  const leg = loadout[LegArmor];
  const classArmor = loadout[ClassArmor];

  const weapons = [kinetic, energy, power];
  const armor = [helmet, gauntlets, chest, leg, classArmor];
  const exoticWeapon = weapons.find((item) => isExoticItem(item));
  const exoticArmor = armor.find((item) => isExoticItem(item));
  return { weapon: exoticWeapon, armor: exoticArmor };
}

export function getWeaponStats(performances?: InstancePerformance[]) {
  if (!performances) {
    return {};
  }
  return performances.reduce(
    (state, currentValue) => {
      Object.entries(currentValue.weapons).forEach(([key, weapon]) => {
        if (!weapon.stats) {
          return;
        }
        if (state[key]) {
          state[key].kills += weapon.stats[UNIQUE_KILLS_KEY].basic.value ?? 0;
          state[key].precisionKills +=
            weapon.stats[PRECISION_KILLS_KEY].basic.value ?? 0;
        } else {
          state[key] = {
            precisionKills: weapon.stats[PRECISION_KILLS_KEY].basic.value ?? 0,
            kills: weapon.stats[UNIQUE_KILLS_KEY].basic.value ?? 0,
          };
        }
      });
      return state;
    },
    {} as Record<string, Stats>,
  );
}

export function createStats(
  weaponStats: Record<string, Stats>,
  item: ItemSnapshot,
): Record<string, UniqueStatValue> | undefined {
  const hashKey = String(item.itemHash);
  if (!weaponStats[hashKey]) {
    return;
  }
  const kills = weaponStats[hashKey]?.kills ?? 0;
  const precision = weaponStats[hashKey]?.precisionKills ?? 0;
  return {
    uniqueWeaponKills: {
      name: 'kills',
      basic: {
        value: kills,
        displayValue: kills.toString(),
      },
    },
    uniqueWeaponPrecisionKills: {
      basic: {
        value: precision,
        displayValue: precision.toString(),
      },
    },
    uniqueWeaponKillsPrecisionKills: {
      basic: {
        value: calculatePercentage(precision, kills),
        displayValue: `${calculatePercentage(precision, kills).toFixed(2)}%`,
      },
    },
  };
}

export function getDetailWeapons(
  loadout?: Loadout,
  performances?: InstancePerformance[],
): (ItemSnapshot & { stats?: Record<string, UniqueStatValue> })[] {
  if (!loadout) return [];

  const weaponStats = getWeaponStats(performances);
  const ordered = getWeapons(loadout);
  return ordered.map((item) => {
    return {
      ...item,
      stats: createStats(weaponStats, item),
    };
  });
}

export function useClassStats(snapshot?: CharacterSnapshot) {
  return Object.values(snapshot?.stats ?? {})
    .map((stat) => ({
      stat: stat.name,
      value: stat.value ?? 0,
    }))
    .filter((it) => it.stat !== 'Power');
}

type SlimItemKind = 'subclass' | 'weapon' | 'armor';

function slimItemSockets(
  sockets: Socket[] | undefined,
  kind: SlimItemKind,
  isExotic: boolean,
): Socket[] {
  if (!sockets || sockets.length === 0) {
    return [];
  }

  if (kind === 'subclass') {
    return sockets
      .filter(
        (socket) =>
          socket.isVisible &&
          socket.isEnabled &&
          socket.itemTypeDisplayName?.toLowerCase().includes('super'),
      )
      .map((socket) => ({
        name: socket.name,
        icon: socket.icon,
        isVisible: socket.isVisible,
        isEnabled: socket.isEnabled,
        itemTypeDisplayName: socket.itemTypeDisplayName,
        itemTypeTieredDisplayName: socket.itemTypeTieredDisplayName ?? '',
        plugHash: socket.plugHash,
        description: '',
      }));
  }

  if (kind === 'weapon') {
    const slimWeaponSockets: Socket[] = [];
    const enhancedSocket = findEnhancedSocket(sockets);
    if (enhancedSocket) {
      slimWeaponSockets.push(toSlimEnhancedSocket(enhancedSocket));
    }

    const catalystSocket = findCatalystMarkerSocket(sockets, isExotic);
    if (
      catalystSocket &&
      catalystSocket.plugHash !== enhancedSocket?.plugHash
    ) {
      slimWeaponSockets.push(toSlimEnhancedSocket(catalystSocket));
    }

    return slimWeaponSockets;
  }

  return [];
}

function slimItemSnapshot(
  item: ItemSnapshot,
  kind: SlimItemKind,
): ItemSnapshot {
  const isSubclass = kind === 'subclass';
  const baseInfo = item.details?.baseInfo;
  const slimStats: Record<string, GunStat> = {};

  if (!isSubclass && item.details?.stats) {
    for (const [key, stat] of Object.entries(item.details.stats)) {
      if (stat) {
        slimStats[key] = {
          hash: stat.hash,
          name: stat.name,
          value: stat.value,
          description: '',
        };
      }
    }
  }

  const slimPerks: Perk[] =
    !isSubclass && item.details?.perks
      ? item.details.perks
          .filter((perk) => Boolean(perk?.name))
          .slice(0, 4)
          .map((perk) => ({
            hash: perk.hash,
            name: perk.name,
            iconPath: perk.iconPath,
            description: '',
          }))
      : [];

  const slimSockets = slimItemSockets(
    item.details?.sockets,
    kind,
    isExoticItem(item),
  );

  return {
    itemHash: item.itemHash,
    instanceId: item.instanceId,
    name: item.name,
    details: {
      baseInfo: baseInfo
        ? {
            bucketHash: baseInfo.bucketHash,
            icon: getItemIconUrl(item.details) || baseInfo.icon,
            instanceId: baseInfo.instanceId,
            itemHash: baseInfo.itemHash,
            itemTypeAndTierDisplayName: baseInfo.itemTypeAndTierDisplayName,
            itemTypeDisplayName: baseInfo.itemTypeDisplayName,
            name: baseInfo.name,
            tierType: baseInfo.tierType,
            tierTypeName: baseInfo.tierTypeName,
          }
        : (undefined as unknown as ItemSnapshot['details']['baseInfo']),
      stats: slimStats,
      perks: slimPerks,
      sockets: slimSockets,
    },
  };
}

/**
 * Strips unused Legendary armor buckets and verbose Bungie manifest descriptions/sockets
 * before serializing snapshots in list loaders or comparison modals (~88% payload reduction).
 */
export function slimSnapshotForCard(
  snapshot: CharacterSnapshot,
): CharacterSnapshot {
  const slimLoadout: Loadout = {};

  if (snapshot.loadout) {
    for (const bucket of [
      SUBCLASS_BUCKET,
      KINETIC_BUCKET,
      ENERGY_BUCKET,
      POWER_BUCKET,
    ]) {
      const item = snapshot.loadout[bucket];
      if (item) {
        slimLoadout[bucket] = slimItemSnapshot(
          item,
          bucket === SUBCLASS_BUCKET ? 'subclass' : 'weapon',
        );
      }
    }

    for (const armorBucket of ARMOR_BUCKETS) {
      const armorItem = snapshot.loadout[armorBucket];
      if (armorItem && isExoticItem(armorItem)) {
        slimLoadout[armorBucket] = slimItemSnapshot(armorItem, 'armor');
      }
    }
  }

  let slimClassStats: CharacterSnapshot['stats'];
  if (snapshot.stats) {
    slimClassStats = {};
    for (const [key, stat] of Object.entries(snapshot.stats)) {
      if (stat?.name && stat.name !== 'Power') {
        slimClassStats[key] = {
          ...stat,
          description: '',
        };
      }
    }
  }

  return {
    ...snapshot,
    loadout: slimLoadout,
    ...(slimClassStats ? { stats: slimClassStats } : {}),
  };
}

export function slimSimilarSnapshotPage(
  page: GetSimilarSnapshotsResponse,
): GetSimilarSnapshotsResponse {
  return {
    ...page,
    target: slimSnapshotForCard(page.target),
    items: page.items.map((item) => ({
      ...item,
      snapshot: slimSnapshotForCard(item.snapshot),
    })),
  };
}
