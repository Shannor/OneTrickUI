import React from 'react';
import type { InstancePerformance } from '~/api';
import { calculateRatio } from '~/calculations/precision';
import { Stat } from '~/components/stat';

interface RawValues {
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  kda: number;
}
interface PerformanceProps {
  performances?: InstancePerformance[];
  rawValues?: RawValues;
}

export function Performance({ performances, rawValues }: PerformanceProps) {
  if (!performances && !rawValues) {
    return null;
  }

  const { kills, deaths, assists } = performances?.reduce(
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
  ) ??
    rawValues ?? { kills: 0, deaths: 0, assists: 0 };

  const kd = rawValues?.kd ?? calculateRatio(kills, deaths);
  const kda = rawValues?.kda ?? calculateRatio(kills + assists, deaths);
  return (
    <div className="flex flex-row gap-4">
      <Stat label="Kills" value={kills.toString()} />
      <Stat label="Assists" value={assists.toString()} />
      <Stat label="Deaths" value={deaths.toString()} />
      <Stat label="K/D" value={kd.toFixed(2)} />
      <Stat label="Effiecieny" value={kda.toFixed(2)} />
    </div>
  );
}
