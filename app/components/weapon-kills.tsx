import { Percent, Tally5, Target } from 'lucide-react';
import React from 'react';
import type { Stats, UniqueStatValue } from '~/api';
import { Label } from '~/components/label';

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
        const icon = getIcon(k);
        return (
          <div key={key} className="flex flex-col items-center gap-2">
            <Label>{getName(k)}</Label>
            <h4 className="text-xl font-semibold tracking-tight">
              {value.basic?.displayValue}
            </h4>
          </div>
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
function getIcon(key: StatKeys): JSX.Element {
  switch (key) {
    case 'uniqueWeaponKills':
      return <Tally5 />;
    case 'uniqueWeaponKillsPrecisionKills':
      return <Percent />;
    case 'uniqueWeaponPrecisionKills':
      return <Target />;
    default:
      return key;
  }
}
