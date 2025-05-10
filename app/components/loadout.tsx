import React from 'react';
import type {
  CharacterSnapshot,
  InstancePerformance,
  ItemSnapshot,
  UniqueStatValue,
} from '~/api';
import { calculatePercentage } from '~/calculations/precision';
import { Weapon } from '~/components/weapon';

interface Props {
  snapshot?: CharacterSnapshot;
  performances: InstancePerformance[];
}
const Kinetic = 1498876634;
const Energy = 2465295065;
const Power = 953998645;
const PrecisionKills = 'uniqueWeaponPrecisionKills';
const UniqueKills = 'uniqueWeaponKills';

interface Stats {
  precisionKills: number;
  kills: number;
}
export function Loadout({ snapshot, performances }: Props) {
  if (!snapshot) {
    return null;
  }
  const weaponStats = performances.reduce(
    (state, currentValue) => {
      Object.entries(currentValue.weapons).forEach(([key, weapon]) => {
        if (!weapon.stats) {
          return;
        }
        if (state[key]) {
          state[key].kills += weapon.stats[UniqueKills].basic.value ?? 0;
          state[key].precisionKills +=
            weapon.stats[PrecisionKills].basic.value ?? 0;
        } else {
          state[key] = {
            precisionKills: weapon.stats[PrecisionKills].basic.value ?? 0,
            kills: weapon.stats[UniqueKills].basic.value ?? 0,
          };
        }
      });
      return state;
    },
    {} as Record<string, Stats>,
  );

  const kinetic = snapshot.loadout[Kinetic];
  const energy = snapshot.loadout[Energy];
  const power = snapshot.loadout[Power];
  const ordered = [kinetic, energy, power].filter(Boolean);

  return (
    <div className="flex flex-row flex-wrap gap-4">
      {ordered.map((item) => {
        const stats = createStats(weaponStats, item);
        return (
          <div className="flex flex-row gap-4">
            <Weapon
              key={item.itemHash}
              referenceId={item.itemHash}
              properties={item.details}
              stats={stats}
            />
          </div>
        );
      })}
    </div>
  );
}

function createStats(weaponStats: Record<string, Stats>, item: ItemSnapshot) {
  const kills = weaponStats[item.itemHash]?.kills ?? 0;
  const precision = weaponStats[item.itemHash]?.precisionKills ?? 0;
  const stats: Record<string, UniqueStatValue> = {
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
  return stats;
}
