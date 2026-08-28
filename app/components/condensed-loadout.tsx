import type { CharacterSnapshot } from '~/api';
import { ClassStats } from '~/charts/ClassStats';
import { SubClassHeader } from '~/components/sub-class/header';
import { Weapon } from '~/components/weapon';
import { getDetailWeapons, useClassStats } from '~/hooks/use-loadout';
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
    <div className="flex flex-col gap-3">
      <SubClassProvider snapshot={snapshot}>
        <SubClassHeader />
      </SubClassProvider>
      <div className="flex flex-col gap-2">
        {data.map((item) => (
          <Weapon
            key={item.itemHash}
            referenceId={item.itemHash}
            properties={item.details}
            stats={item.stats}
            hideStats
            compact
          />
        ))}
      </div>
      <ClassStats data={values} />
    </div>
  );
}
