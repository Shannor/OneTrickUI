import React from 'react';
import type { CharacterSnapshot, InstancePerformance } from '~/api';
import { Weapon } from '~/components/weapon';
import { useWeaponLoadout } from '~/hooks/use-loadout';
import { cn } from '~/lib/utils';

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
  const data = useWeaponLoadout(snapshot?.loadout, performances);
  if (data.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-wrap gap-10',
        layout === 'horizontal' ? 'flex-row' : 'flex-col',
        className,
      )}
    >
      {data.map((item) => {
        return (
          <Weapon
            key={item.itemHash}
            referenceId={item.itemHash}
            properties={item.details}
            stats={item.stats}
            hideStats={hideStats}
            layout={layout}
          />
        );
      })}
    </div>
  );
}
