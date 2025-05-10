import React from 'react';
import type { Stats, UniqueStatValue } from '~/api';
import { Label } from '~/components/label';
import { Stat } from '~/components/stat';

interface Props {
  stats: Record<string, UniqueStatValue>;
}

type StatKeys =
  | 'uniqueWeaponKills'
  | 'uniqueWeaponKillsPrecisionKills'
  | 'uniqueWeaponPrecisionKills';

export const WeaponKills: React.FC<Props> = ({ stats }) => {
  return (
    <div className="flex flex-row gap-4">
      {Object.entries(stats).map(([key, value]) => {
        const k = key as StatKeys;
        return (
          <Stat
            key={key}
            label={getName(k)}
            value={value.basic?.displayValue ?? 'N/A'}
          />
        );
      })}
    </div>
  );
};

function getName(key: StatKeys): string {
  switch (key) {
    case 'uniqueWeaponKills':
      return 'Kills';
    case 'uniqueWeaponKillsPrecisionKills':
      return 'Accuracy';
    case 'uniqueWeaponPrecisionKills':
      return 'Headshots';
    default:
      return key;
  }
}
