import { Skull, Tally5, Users } from 'lucide-react';
import type { InstancePerformance } from '~/api';
import { calculateRatio } from '~/calculations/precision';

interface PerformanceProps {
  performances: InstancePerformance[];
}

export function Performance({ performances }: PerformanceProps) {
  const totalPerformance = performances.reduce(
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
  const kd = calculateRatio(totalPerformance.kills, totalPerformance.deaths);
  const kda = calculateRatio(
    totalPerformance.kills + totalPerformance.assists,
    totalPerformance.deaths,
  );
  return (
    <div className="flex flex-col gap-4">
      <div>Performance</div>
      <div>
        <Tally5 />
        <div>Kills: {totalPerformance.kills}</div>
      </div>
      <div className="flex flex-row gap-1">
        <Users />
        <div>Assists: {totalPerformance.assists}</div>
      </div>
      <div>
        <Skull />
        <div>Deaths: {totalPerformance.deaths}</div>
      </div>
      <div>K/D: {kd}</div>
      <div>Efficiency: {kda}</div>
    </div>
  );
}
