import React from 'react';
import type { WeaponInstanceMetrics } from '~/api';
import { Sockets } from '~/components/sockets';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { WeaponKills } from '~/components/weapon-kills';
import { WeaponStats } from '~/components/weapon-stats';

type Props = WeaponInstanceMetrics;
export const Weapon: React.FC<Props> = ({
  referenceId,
  properties,
  stats,
  display,
}) => {
  return (
    <Card key={referenceId} className="">
      <CardHeader className="flex flex-row gap-4">
        {display?.icon && (
          <img
            alt={`${display.name} image`}
            width="75"
            height="75"
            src={display?.icon}
          />
        )}
        <div className="flex flex-col gap-1">
          <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
            {properties?.baseInfo?.name ?? display?.name ?? 'Unknown Gun'}
          </h3>
          <div>{display?.description}</div>
        </div>
      </CardHeader>

      <CardContent className="flex w-full flex-col gap-10">
        {stats && (
          <div className="flex flex-col self-center">
            <WeaponKills stats={stats} />
          </div>
        )}
        <div className="flex w-full flex-grow flex-row gap-10">
          {properties?.stats && (
            <div className="w-1/2">
              <WeaponStats stats={properties.stats} />
            </div>
          )}
          {properties?.sockets && (
            <div className="flex flex-col">
              <Sockets sockets={properties?.sockets} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
