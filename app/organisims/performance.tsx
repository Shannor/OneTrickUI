import { Skull, Tally5, Users } from 'lucide-react';
import React from 'react';
import type { InstancePerformance } from '~/api';
import { calculateRatio } from '~/calculations/precision';
import { Label } from '~/components/label';
import { Stat } from '~/components/stat';

interface PerformanceProps {
  performances: InstancePerformance[];
}

export function Performance({ performances }: PerformanceProps) {
  const { kills, deaths, assists } = performances.reduce(
    (state, { playerStats }) => {
      state.kills += playerStats.kills?.value ?? 0;
      state.assists += playerStats.assists?.value ?? 0;
      state.deaths += playerStats.deaths?.value ?? 0;
      return state;
    },
    {
      kills: 0,
      assists: 0,
      deaths: 0,
    },
  );
  const kd = calculateRatio(kills, deaths);
  const kda = calculateRatio(kills + assists, deaths);
  return (
    <div className="flex flex-row gap-4">
      <Stat label="Kills" value={kills.toString()} />
      <Stat label="Assists" value={assists.toString()} />
      <Stat label="Deaths" value={deaths.toString()} />
      <Stat label="K/D" value={kd.toString()} />
      <Stat label="Effiecieny" value={kda.toString()} />
    </div>
  );
}
