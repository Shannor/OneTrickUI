import React from 'react';
import { Link } from 'react-router';
import type { CharacterSnapshot, InstancePerformance, User } from '~/api';
import { calculateRatio } from '~/calculations/precision';
import { ClassStats } from '~/charts/ClassStats';
import { ArmorSet } from '~/components/armor-set';
import { Label } from '~/components/label';
import { Abilities, Aspects, Fragments, Super } from '~/components/sub-class';
import { Card, CardContent } from '~/components/ui/card';
import { Weapon } from '~/components/weapon';
import { Performance, type StatItem } from '~/organisims/performance';
import { SubClassProvider } from '~/providers/sub-class-provider';

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
  const weapons = Object.values(performance.weapons ?? {}).filter(
    (it) => !!it?.properties?.baseInfo?.name,
  );

  const kills = performance.playerStats.kills?.value ?? 0;
  const assists = performance.playerStats.assists?.value ?? 0;
  const deaths = performance.playerStats.deaths?.value ?? 0;
  const kd = calculateRatio(kills, deaths);
  const kda = calculateRatio(kills + assists, deaths);

  const stats: StatItem[] = [
    { label: 'Kills', value: kills.toString() },
    { label: 'Assists', value: assists.toString() },
    { label: 'Deaths', value: deaths.toString() },
    { label: 'K/D', value: kd.toFixed(2) },
    { label: 'Efficiency', value: kda.toFixed(2) },
  ];

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
              <Link to={`/profile/${user?.id}`} viewTransition>
                {user?.displayName ?? 'Unknown Player'}
              </Link>
            </h4>
          </div>
        </div>

        {/* Stats (Top, full width) */}
        <div className="col-span-12 flex flex-row items-start justify-between gap-4">
          <Performance stats={stats} />
        </div>

        {weapons.length > 0 && (
          <div className="col-span-12 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
              {weapons.map((w) => (
                <Weapon key={String(w.referenceId)} {...w} />
              ))}
            </div>
          </div>
        )}
        <div className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SubClassProvider snapshot={snapshot}>
            <div className="flex flex-col gap-4">
              <Super />
              <Abilities />
              <Aspects />
              <Fragments />
            </div>
          </SubClassProvider>
          <ArmorSet snapshot={snapshot} />
          <ClassStats data={values} />
        </div>
      </CardContent>
    </Card>
  );
};
