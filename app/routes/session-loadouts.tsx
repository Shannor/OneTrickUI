import React from 'react';
import { CondensedLoadout } from '~/components/condensed-loadout';
import { useSessionData } from '~/hooks/use-route-loaders';

export default function SessionLoadouts() {
  const { snapshots } = useSessionData();

  if (!snapshots) {
    return <div>No snapshots</div>;
  }

  return (
    <div className="flex flex-row divide-x-2 overflow-x-auto p-4">
      {Object.values(snapshots).map((snapshot) => (
        <div key={snapshot.id} className="min-w-[300px] px-4">
          <CondensedLoadout snapshot={snapshot} />
        </div>
      ))}
    </div>
  );
}
