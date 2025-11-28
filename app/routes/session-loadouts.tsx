import React, { useState } from 'react';
import { Link } from 'react-router';
import { CondensedLoadout } from '~/components/condensed-loadout';
import { MergeLoadoutDialog } from '~/components/merge-loadout-dialog';
import { useSessionData } from '~/hooks/use-route-loaders';
import { Button } from '~/components/ui/button';

import type { Route } from './+types/session-loadouts';

export default function SessionLoadouts({ params }: Route.ComponentProps) {
  const { snapshots } = useSessionData();

  if (!snapshots) {
    return <div>No snapshots</div>;
  }

  const allSnapshots = Object.values(snapshots);
  const [selectedSnapshot, setSelectedSnapshot] = useState<
    (typeof allSnapshots)[0] | null
  >(null);

  return (
    <div className="w-full">
      <div className="flex flex-row divide-x-2 overflow-x-auto p-4">
        {allSnapshots.map((snapshot) => (
          <div
            key={snapshot.id}
            className="flex min-w-[300px] flex-col gap-4 px-4"
          >
            <Link
              to={`/profile/${params?.id}/c/${params.characterId}/loadouts/${snapshot.id}`}
            >
              <h3 className="hover:text-blue-500 hover:underline">
                {snapshot.name}
              </h3>
            </Link>
            <Button
              variant="ghost"
              onClick={() => setSelectedSnapshot(snapshot)}
            >
              Merge Loadout
            </Button>
            <CondensedLoadout snapshot={snapshot} />
          </div>
        ))}
      </div>
      <MergeLoadoutDialog
        isOpen={!!selectedSnapshot}
        onOpenChange={(open) => !open && setSelectedSnapshot(null)}
        baseSnapshot={selectedSnapshot}
        availableSnapshots={allSnapshots}
      />
    </div>
  );
}
