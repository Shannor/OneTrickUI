import React from 'react';
import { data } from 'react-router';
import { getSnapshot } from '~/api';
import { ClassStats } from '~/charts/ClassStats';
import { ArmorSet } from '~/components/armor-set';
import { Class } from '~/components/class';
import { Loadout } from '~/components/loadout';

import type { Route } from './+types/loadout-details';

export async function loader({ params }: Route.LoaderArgs) {
  const { snapshotId } = params;
  const { data: snapshot, error } = await getSnapshot({
    path: { snapshotId },
  });
  if (error) {
    console.error(error);
    throw data('Unexpected Error', { status: 500 });
  }
  if (!snapshot) {
    throw data('Record Not Found', { status: 404 });
  }
  return {
    snapshot,
  };
}

// TODO: Join this component with the player-card.tsx
export default function LoadoutDetails({ loaderData }: Route.ComponentProps) {
  const { snapshot } = loaderData;
  const values = Object.values(snapshot.stats ?? {})
    .map((stat) => ({
      stat: stat.name,
      value: stat.value,
    }))
    .filter((it) => it.stat !== 'Power');
  return (
    <div className="flex flex-col gap-20">
      <div className="flex flex-row gap-10">
        <Class snapshot={snapshot} />
        <ClassStats data={values} />
      </div>
      <ArmorSet snapshot={snapshot} />
      <Loadout snapshot={snapshot} />
    </div>
  );
}
