import React from 'react';
import { data } from 'react-router';
import { getSnapshot } from '~/api';
import { ClassStats } from '~/charts/ClassStats';
import { ArmorSet } from '~/components/armor-set';
import { Abilities, Aspects, Fragments, Super } from '~/components/sub-class';
import { Weapon } from '~/components/weapon';
import { useClassStats, useWeapons } from '~/hooks/use-loadout';
import { SubClassProvider } from '~/providers/sub-class-provider';

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
  const values = useClassStats(snapshot);
  const data = useWeapons(snapshot?.loadout);

  return (
    <div className="flex flex-col gap-20">
      <title>{`${snapshot.name ?? 'Loadout'} - Details`}</title>
      <meta
        property="og:title"
        content={`${snapshot.name ?? 'Loadout'} - Details`}
      />
      <meta
        name="description"
        content={`View armor stats and gear details for ${snapshot.name ?? 'this loadout'}.`}
      />
      <div className="flex flex-col gap-10 lg:flex-row">
        <SubClassProvider snapshot={snapshot}>
          <div className="flex flex-col gap-4">
            <Super />
            <Abilities />
            <Aspects />
            <Fragments />
          </div>
        </SubClassProvider>
        <ClassStats data={values} />
      </div>
      <div className="col-span-12 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
          {data.map((item) => (
            <Weapon
              key={item.itemHash}
              referenceId={item.itemHash}
              properties={item.details}
              stats={item.stats}
            />
          ))}
        </div>
      </div>
      <div className="flex max-w-[400px] flex-col">
        <ArmorSet snapshot={snapshot} />
      </div>
    </div>
  );
}
