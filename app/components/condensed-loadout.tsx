import React from 'react';
import type { CharacterSnapshot } from '~/api';
import { ClassStats } from '~/charts/ClassStats';
import { Class } from '~/components/class';
import { Weapon } from '~/components/weapon';
import { useClassStats, useWeaponLoadout } from '~/hooks/use-loadout';
import { cn } from '~/lib/utils';
import { type StatItem } from '~/organisims/performance';

interface CondensedLoadoutProps {
  snapshot: CharacterSnapshot;
  performance?: StatItem[];
}

export function CondensedLoadout({ snapshot }: CondensedLoadoutProps) {
  const data = useWeaponLoadout(snapshot.loadout);
  const values = useClassStats(snapshot);
  return (
    <div className="flex flex-col gap-4">
      <Class snapshot={snapshot} condensed />
      <div className={cn('flex flex-col flex-wrap gap-1')}>
        {data.map((item) => {
          return (
            <Weapon
              key={item.itemHash}
              referenceId={item.itemHash}
              properties={item.details}
              stats={item.stats}
              hideStats
              layout="vertical"
            />
          );
        })}
      </div>
      <ClassStats data={values} />
    </div>
  );
}
