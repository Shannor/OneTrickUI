import { ExternalLink } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router';
import { CondensedLoadout } from '~/components/condensed-loadout';
import { MergeLoadoutDialog } from '~/components/merge-loadout-dialog';
import { Button } from '~/components/ui/button';
import { useProfileData, useSessionData } from '~/hooks/use-route-loaders';

import type { Route } from './+types/session-loadouts';

export default function SessionLoadouts({ params }: Route.ComponentProps) {
  const { snapshots } = useSessionData();
  const { type } = useProfileData();
  const isOwner = type === 'owner';

  if (!snapshots) {
    return <div>No snapshots</div>;
  }

  const allSnapshots = Object.values(snapshots);
  const [selectedSnapshot, setSelectedSnapshot] = useState<
    (typeof allSnapshots)[0] | null
  >(null);

  return (
    <div className="w-full">
      <div className="flex flex-col flex-wrap gap-12 md:flex-row md:gap-6">
        {allSnapshots.map((snapshot) => (
          <div
            key={snapshot.id}
            className="flex w-auto flex-col gap-4 md:min-w-[300px] lg:px-4"
          >
            <Link
              to={`/profile/${params?.id}/c/${params.characterId}/loadouts/${snapshot.id}`}
              className="group flex cursor-pointer items-center gap-2 hover:text-blue-500 hover:underline"
            >
              <h3 className="group-hover:text-blue-500 group-hover:underline">
                {snapshot.name}
              </h3>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 group-hover:underline" />
            </Link>
            {isOwner && (
              <Button
                variant="outline"
                onClick={() => setSelectedSnapshot(snapshot)}
              >
                Merge Loadout
              </Button>
            )}
            <CondensedLoadout snapshot={snapshot} />
          </div>
        ))}
      </div>
      {isOwner && (
        <MergeLoadoutDialog
          isOpen={!!selectedSnapshot}
          onOpenChange={(open) => !open && setSelectedSnapshot(null)}
          baseSnapshot={selectedSnapshot}
          availableSnapshots={allSnapshots}
        />
      )}
    </div>
  );
}
