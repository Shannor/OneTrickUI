import React from 'react';
import { Link } from 'react-router';
import type { CharacterSnapshot, InstancePerformance, User } from '~/api';
import { ClassStats } from '~/charts/ClassStats';
import { ArmorSet } from '~/components/armor-set';
import { Class } from '~/components/class';
import { Label } from '~/components/label';
import { PlayerStatsGrid } from '~/components/player-stats';
import { Card, CardContent } from '~/components/ui/card';
import { Weapon } from '~/components/weapon';

export type PlayerCardProps = {
  user?: User;
  performance: InstancePerformance;
  snapshot?: CharacterSnapshot;
};

export const PlayerCard: React.FC<PlayerCardProps> = ({
  user,
  performance,
  snapshot,
}) => {
  const stats = performance.playerStats;
  const weapons = Object.values(performance.weapons ?? {}).filter(
    (it) => !!it?.properties?.baseInfo?.name,
  );

  const values = Object.values(snapshot?.stats ?? {})
    .map((stat) => ({
      stat: stat.name,
      value: stat.value,
    }))
    .filter((it) => it.stat !== 'Power');
  return (
    <Card>
      <CardContent className="grid grid-cols-12 gap-12 p-4">
        {/* Header (kept minimal, spans full width) */}
        <div className="col-span-12 flex flex-row items-start justify-between gap-4">
          <div className="flex flex-col">
            <Label>Player</Label>
            {/*TODO: Make a big font and header*/}
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight hover:text-blue-500">
              <Link to={`/dashboard/profiles/${user?.id}`} viewTransition>
                {user?.displayName ?? 'Unknown Player'}
              </Link>
            </h4>
          </div>
        </div>

        {/* Stats (Top, full width) */}
        <div className="col-span-12 flex flex-row items-start justify-between gap-4">
          <PlayerStatsGrid stats={stats} />
        </div>

        <div className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Class snapshot={snapshot} />
          <ArmorSet snapshot={snapshot} />
          <ClassStats data={values} />
        </div>

        {weapons.length > 0 && (
          <div className="col-span-12 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {weapons.map((w) => (
                <Weapon key={String(w.referenceId)} {...w} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
