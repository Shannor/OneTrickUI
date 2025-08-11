import React from 'react';
import type {
  CharacterSnapshot,
  InstancePerformance,
  User,
} from '~/api';
import { Card, CardContent } from '~/components/ui/card';
import { Label } from '~/components/label';
import { Weapon } from '~/components/weapon';

export type PlayerCardProps = {
  characterId: string;
  user?: User;
  performance: InstancePerformance;
  snapshot?: CharacterSnapshot;
  selected?: boolean;
};

export const PlayerCard: React.FC<PlayerCardProps> = ({
  characterId,
  user,
  performance,
  snapshot,
  selected,
}) => {
  const stats = performance.playerStats;
  const weapons = Object.values(performance.weapons ?? {});
  const snapshotItems = snapshot ? Object.values(snapshot.loadout ?? {}) : [];

  return (
    <Card className={selected ? 'ring-2 ring-blue-500' : ''}>
      <CardContent className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex flex-row items-start justify-between gap-4">
          <div className="flex flex-col">
            <div className="text-sm text-muted-foreground">Player</div>
            <div className="font-semibold">{user?.displayName ?? 'Unknown Player'}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Character</div>
            <div className="font-mono text-xs">{characterId}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2 text-center">
          <div>
            <Label>Kills</Label>
            <div className="font-semibold">{stats.kills?.displayValue ?? 'N/A'}</div>
          </div>
          <div>
            <Label>Deaths</Label>
            <div className="font-semibold">{stats.deaths?.displayValue ?? 'N/A'}</div>
          </div>
          <div>
            <Label>Assists</Label>
            <div className="font-semibold">{stats.assists?.displayValue ?? 'N/A'}</div>
          </div>
          <div>
            <Label>KD/A</Label>
            <div className="font-semibold">{stats.kda?.displayValue ?? 'N/A'}</div>
          </div>
          <div>
            <Label>K/D</Label>
            <div className="font-semibold">{stats.kd?.displayValue ?? 'N/A'}</div>
          </div>
        </div>

        {/* Weapons */}
        {weapons.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="scroll-m-20 text-lg font-semibold tracking-tight">Weapons</h4>
            <div className="flex flex-col gap-4">
              {weapons.map((w) => (
                <Weapon key={String(w.referenceId)} {...w} />
              ))}
            </div>
          </div>
        )}

        {/* Snapshot summary (optional) */}
        {snapshot && (
          <div className="flex flex-col gap-2">
            <h4 className="scroll-m-20 text-lg font-semibold tracking-tight">Snapshot</h4>
            <div className="flex flex-row items-center justify-between">
              <div className="font-semibold">{snapshot.name}</div>
              <div className="text-xs text-muted-foreground">
                Updated {new Date(snapshot.updatedAt as any).toLocaleString()}
              </div>
            </div>
            {snapshotItems.length > 0 && (
              <div className="flex flex-row flex-wrap gap-2">
                {snapshotItems.map((it) => (
                  <div
                    key={it.instanceId}
                    className="rounded bg-muted px-2 py-1 text-xs"
                  >
                    {it.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
