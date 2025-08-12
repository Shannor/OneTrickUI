import React from 'react';
import type { GunStat, Stats } from '~/api';

interface Props {
  stats: Stats;
}
const SPECIAL_STATS: Record<number, string> = {
  3871231066: 'Magazine',
  2715839340: 'Recoil Direction',
  4284893193: 'Rounds Per Minute',
  2961396640: 'Charge Time',
};

const ORDER: Record<number, number> = {
  4284893193: 1, // RPM
  2961396640: 1, // Charge Time
  4043523819: 2, // Impact
  1240592695: 3, // Range
  155624089: 4, // Stability
  943549884: 5, // Handling
  4188031367: 6, // Reload
  1345609583: 7, // AA
  2714457168: 8, // AE
  3555269338: 9, // Zoom
  2715839340: 10, // Recoil
  3871231066: 11, // Mag
};

enum StatEnum {
  RPM = 4284893193, // Rounds Per Minute
  ChargeTime = 2961396640, // Charge Time
  Impact = 4043523819, // Impact
  Range = 1240592695, // Range
  Stability = 155624089, // Stability
  Handling = 943549884, // Handling
  Reload = 4188031367, // Reload
  AA = 1345609583, // Aim Assistance
  AE = 2714457168, // Airborne Effectiveness
  Zoom = 3555269338, // Zoom
  Recoil = 2715839340, // Recoil Direction
  Mag = 3871231066, // Magazine
}
export const WeaponStats: React.FC<Props> = ({ stats }) => {
  const barStats = Object.values(stats)
    .filter((it) => SPECIAL_STATS[it.hash] === undefined && it.value <= 100)
    .sort((a, b) => ORDER[a.hash] - ORDER[b.hash]);
  return (
    <div className="flex flex-col">
      {barStats.map((it) => (
        <div key={it.hash} className="grid grid-cols-12 items-center gap-4">
          <div className="col-span-3">{updateNames(it)}</div>
          <div className="col-span-7">
            <Bar value={it.value} />
          </div>
          <div className="col-span-2">{it.value}</div>
        </div>
      ))}
    </div>
  );
};

function updateNames(stat: GunStat): string {
  switch (stat.hash) {
    case StatEnum.RPM:
      return 'RPM';
    case StatEnum.AE:
      return 'A.E.';
    case StatEnum.Reload:
      return 'Reload';
    case StatEnum.AA:
      return 'A.A.';
    default:
      return stat.name;
  }
}
const Bar: React.FC<{ value: number }> = ({ value }) => {
  const percentage = Math.min(Math.max(value, 0), 100); // Ensures the value is between 0 and 100
  return (
    <div className="relative h-2 w-full rounded bg-gray-600">
      <div
        className="absolute left-0 top-0 h-2 rounded-l bg-primary"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
