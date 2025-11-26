import React from 'react';
import type { CharacterSnapshot } from '~/api';
import { Class } from '~/components/class';
import { Loadout } from '~/components/loadout';
import { Performance, type StatItem } from '~/organisims/performance';

interface CondensedLoadoutProps {
  snapshot: CharacterSnapshot;
  performance?: StatItem[];
}

export function CondensedLoadout({
  snapshot,
  performance,
}: CondensedLoadoutProps) {
  return (
    <div className="flex flex-col gap-4 divide-y-2">
      <Loadout
        snapshot={snapshot}
        hideStats
        layout="vertical"
        className="gap-1"
      />
      <Class snapshot={snapshot} condensed />
      {performance && <Performance stats={performance} />}
    </div>
  );
}
