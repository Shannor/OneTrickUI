import React from 'react';
import type { CharacterSnapshot, InstancePerformance } from '~/api';
import { Weapon } from '~/components/weapon';
import { cn, getWeaponsFromLoadout } from '~/lib/utils';
import { useCreateStats, useWeaponStats } from '~/hooks/use-loadout';

interface Props {
  snapshot?: CharacterSnapshot;
  performances?: InstancePerformance[];
  className?: string;
  hideStats?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export function Loadout({
  snapshot,
  performances,
  className,
  hideStats,
  layout = 'horizontal',
}: Props) {
  if (!snapshot) {
    return null;
  }
  const weaponStats = useWeaponStats(performances);
  const ordered = getWeaponsFromLoadout(snapshot.loadout);

  return (
    <div
      className={cn(
        'flex flex-wrap gap-10',
        layout === 'horizontal' ? 'flex-row' : 'flex-col',
        className,
      )}
    >
      {ordered.map((item) => {
        const stats = useCreateStats(weaponStats, item);
        return (
          <Weapon
            key={item.itemHash}
            referenceId={item.itemHash}
            properties={item.details}
            stats={stats}
            hideStats={hideStats}
            layout={layout}
          />
        );
      })}
    </div>
  );
}
