import { ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CondensedLoadout } from '~/components/condensed-loadout';
import { Empty } from '~/components/empty';
import { MergeLoadoutDialog } from '~/components/merge-loadout-dialog';
import { Button } from '~/components/ui/button';
import { groupSnapshotsByCompatibility } from '~/hooks/use-loadout';
import { useProfileData, useSessionData } from '~/hooks/use-route-loaders';

import type { Route } from './+types/session-loadouts';

export default function SessionLoadouts({ params }: Route.ComponentProps) {
  const { snapshots } = useSessionData();
  const { type } = useProfileData();
  const isOwner = type === 'owner';

  const allSnapshots = useMemo(
    () => (snapshots ? Object.values(snapshots) : []),
    [snapshots],
  );

  const compatibleById = useMemo(
    () => groupSnapshotsByCompatibility(allSnapshots),
    [allSnapshots],
  );

  const [selectedSnapshot, setSelectedSnapshot] = useState<
    (typeof allSnapshots)[0] | null
  >(null);

  if (allSnapshots.length === 0) {
    return (
      <Empty
        title="Get in the Crucible!"
        description="Play some games so we can get new information!"
      />
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {allSnapshots.map((snapshot) => {
          const compatibleSnapshots = compatibleById[snapshot.id] ?? [];
          return (
            <div key={snapshot.id} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Link
                  to={`/profile/${params?.id}/c/${params.characterId}/loadouts/${snapshot.id}`}
                  className="group flex items-center gap-1.5 hover:text-primary"
                >
                  <h3 className="truncate text-base font-bold group-hover:underline">
                    {snapshot.name ?? 'Loadout'}
                  </h3>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                </Link>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={compatibleSnapshots.length === 0}
                    onClick={() => setSelectedSnapshot(snapshot)}
                    className="w-full justify-center"
                  >
                    Merge Loadout
                  </Button>
                )}
              </div>
              <CondensedLoadout snapshot={snapshot} />
            </div>
          );
        })}
      </div>
      {isOwner && (
        <MergeLoadoutDialog
          isOpen={!!selectedSnapshot}
          onOpenChange={(open) => !open && setSelectedSnapshot(null)}
          baseSnapshot={selectedSnapshot}
          availableSnapshots={
            selectedSnapshot ? (compatibleById[selectedSnapshot.id] ?? []) : []
          }
        />
      )}
    </div>
  );
}


