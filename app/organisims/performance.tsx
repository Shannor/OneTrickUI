import React from 'react';
import { Stat } from '~/components/stat';
import { cn } from '~/lib/utils';

export interface StatItem {
  label: string;
  value: string;
  valueClassName?: string;
}

interface PerformanceProps {
  stats: StatItem[];
  className?: string;
}

export function Performance({ stats, className }: PerformanceProps) {
  if (!stats || stats.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-row flex-wrap gap-4', className)}>
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
