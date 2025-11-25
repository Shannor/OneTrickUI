import React from 'react';
import { Stat } from '~/components/stat';

export interface StatItem {
  label: string;
  value: string;
  valueClassName?: string;
}

interface PerformanceProps {
  stats: StatItem[];
}

export function Performance({ stats }: PerformanceProps) {
  if (!stats || stats.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-row gap-4">
      {stats.map((stat) => (
        <Stat
          key={stat.label}
          label={stat.label}
          value={stat.value}
          valueClassName={stat.valueClassName}
        />
      ))}
    </div>
  );
}
