import React from 'react';
import type { PlayerStats } from '~/api';
import { Label } from '~/components/label';
import { cn } from '~/lib/utils';

interface Props {
  stats: PlayerStats | undefined;
  className?: string;
}

export const PlayerStatsGrid: React.FC<Props> = ({ stats, className }) => {
  if (!stats) return null;
  return (
    <div className={cn('flex flex-row flex-wrap gap-4', className)}>
      <div>
        <Label>Kills</Label>
        <div className="font-semibold">
          {stats.kills?.displayValue ?? 'N/A'}
        </div>
      </div>
      <div>
        <Label>Deaths</Label>
        <div className="font-semibold">
          {stats.deaths?.displayValue ?? 'N/A'}
        </div>
      </div>
      <div>
        <Label>Assists</Label>
        <div className="font-semibold">
          {stats.assists?.displayValue ?? 'N/A'}
        </div>
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
  );
};
