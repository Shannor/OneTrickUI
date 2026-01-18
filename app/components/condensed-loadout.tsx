import React from 'react';
import type { CharacterSnapshot } from '~/api';
import { ClassStats } from '~/charts/ClassStats';
import { Super } from '~/components/sub-class';
import { Weapon } from '~/components/weapon';
import { getDetailWeapons, useClassStats } from '~/hooks/use-loadout';
import { cn } from '~/lib/utils';
import { type StatItem } from '~/organisims/performance';
import { SubClassProvider } from '~/providers/sub-class-provider';

interface CondensedLoadoutProps {
  snapshot: CharacterSnapshot;
  performance?: StatItem[];
}

export function CondensedLoadout({ snapshot }: CondensedLoadoutProps) {
  const data = getDetailWeapons(snapshot.loadout);
  const values = useClassStats(snapshot);
  return (
    <div className="flex flex-col gap-4">
      <SubClassProvider snapshot={snapshot}>
        <Super />
      </SubClassProvider>
      <div className={cn('flex flex-row flex-wrap gap-4 md:flex-col md:gap-2')}>
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
