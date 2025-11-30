import type {
  CharacterSnapshot,
  InstancePerformance,
  ItemSnapshot,
  Loadout,
  UniqueStatValue,
} from '~/api';
import { calculatePercentage } from '~/calculations/precision';

const PRECISION_KILLS_KEY = 'uniqueWeaponPrecisionKills';
const UNIQUE_KILLS_KEY = 'uniqueWeaponKills';

const Kinetic = 1498876634;
const Energy = 2465295065;
const Power = 953998645;

const HelmetArmor = 3448274439;
const GauntletsArmor = 3551918588;
const ChestArmor = 14239492;
const LegArmor = 20886954;
const ClassArmor = 1585787867;

interface Stats {
  precisionKills: number;
  kills: number;
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
  const exoticWeapon = weapons.find(
    (item) =>
      !!item && item.details.baseInfo.tierTypeName.toLowerCase() === 'exotic',
  );
  const exoticArmor = armor.find(
    (item) =>
      !!item && item.details.baseInfo.tierTypeName.toLowerCase() === 'exotic',
  );
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
  if (!weaponStats[item.itemHash]) {
    return;
  }
  const kills = weaponStats[item.itemHash]?.kills ?? 0;
  const precision = weaponStats[item.itemHash]?.precisionKills ?? 0;
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
        displayValue: `${calculatePercentage(precision, kills)}%`,
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

export function useClassStats(snapshot: CharacterSnapshot) {
  return Object.values(snapshot.stats ?? {})
    .map((stat) => ({
      stat: stat.name,
      value: stat.value ?? 0,
    }))
    .filter((it) => it.stat !== 'Power');
}
