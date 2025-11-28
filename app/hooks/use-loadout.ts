import { useMemo } from 'react';
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

interface Stats {
  precisionKills: number;
  kills: number;
}

export function useWeaponsFromLoadout(loadout?: Loadout): ItemSnapshot[] {
  return useMemo(() => {
    if (!loadout) {
      return [];
    }
    const kinetic = loadout[Kinetic];
    const energy = loadout[Energy];
    const power = loadout[Power];
    return [kinetic, energy, power].filter(Boolean) as ItemSnapshot[];
  }, [loadout]);
}

export function useWeaponStats(performances?: InstancePerformance[]) {
  return useMemo(() => {
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
              precisionKills:
                weapon.stats[PRECISION_KILLS_KEY].basic.value ?? 0,
              kills: weapon.stats[UNIQUE_KILLS_KEY].basic.value ?? 0,
            };
          }
        });
        return state;
      },
      {} as Record<string, Stats>,
    );
  }, [performances]);
}

export function useCreateStats(
  weaponStats: Record<string, Stats>,
  item: ItemSnapshot,
): Record<string, UniqueStatValue> | undefined {
  return useMemo(() => {
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
  }, [weaponStats, item]);
}

export function useWeaponLoadout(
  loadout?: Loadout,
  performances?: InstancePerformance[],
) {
  if (!loadout) return [];

  const weaponStats = useWeaponStats(performances);
  const ordered = useWeaponsFromLoadout(loadout);
  return ordered.map((item) => {
    return {
      ...item,
      stats: useCreateStats(weaponStats, item),
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
