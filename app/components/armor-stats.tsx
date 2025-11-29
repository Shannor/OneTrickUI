import React from 'react';
import type { Stats } from '~/api';
import { Bar } from '~/components/ui/bar';

interface Props {
  stats: Stats;
}
export const ArmorStats: React.FC<Props> = ({ stats }) => {
  const barStats = Object.values(stats);
  // .sort((a, b) => ORDER[a.hash] - ORDER[b.hash]);
  return (
    <div className="flex flex-col">
      {barStats.map((it) => (
        <div key={it.hash} className="grid grid-cols-12 items-center gap-4">
          <div className="col-span-3">{it.name}</div>
          <div className="col-span-7">
            <Bar value={it.value} max={45} />
          </div>
          <div className="col-span-2">{it.value}</div>
        </div>
      ))}
    </div>
  );
};
