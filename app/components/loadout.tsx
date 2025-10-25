import React from 'react';
import type {
  CharacterSnapshot,
  InstancePerformance,
  ItemSnapshot,
  UniqueStatValue,
} from '~/api';
import { calculatePercentage } from '~/calculations/precision';
import { Weapon } from '~/components/weapon';
import { cn, getWeaponsFromLoadout } from '~/lib/utils';

interface Props {
  snapshot?: CharacterSnapshot;
  performances?: InstancePerformance[];
  className?: string;
  hideStats?: boolean;
}

const PrecisionKills = 'uniqueWeaponPrecisionKills';
const UniqueKills = 'uniqueWeaponKills';

interface Stats {
  precisionKills: number;
  kills: number;
}
export function Loadout({
  snapshot,
  performances,
  className,
  hideStats,
}: Props) {
  if (!snapshot) {
    return null;
  }
  const weaponStats =
    performances?.reduce(
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
    ) ?? {};

  const ordered = getWeaponsFromLoadout(snapshot.loadout);
  return (
    <div className={cn('flex flex-row flex-wrap gap-10', className)}>
      {ordered.map((item) => {
        const stats = createStats(weaponStats, item);
        return (
          <Weapon
            key={item.itemHash}
            referenceId={item.itemHash}
            properties={item.details}
            stats={stats}
            hideStats={hideStats}
          />
        );
      })}
    </div>
  );
}

function createStats(
  weaponStats: Record<string, Stats>,
  item: ItemSnapshot,
): Record<string, UniqueStatValue> | undefined {
  if (!weaponStats[item.itemHash]) {
    return;
  }
  const kills = weaponStats[item.itemHash]?.kills ?? 0;
  const precision = weaponStats[item.itemHash]?.precisionKills ?? 0;
  const stats = {
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
