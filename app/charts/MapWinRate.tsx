'use client';

import React from 'react';
import { Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart';
import type { CustomTimeWindow, MapResult } from '~/lib/metrics';
import { cn } from '~/lib/utils';

const chartConfig = {
  loses: {
    label: 'Loses',
    color: 'var(--chart-error)',
  },
  wins: {
    label: 'Wins',
    color: 'var(--chart-primary)',
  },
} satisfies ChartConfig;

interface Props {
  className?: string;
  data: MapResult[];
  timeWindow?: CustomTimeWindow;
  syncId?: string;
}
export function MapWinRate({ className, data, syncId }: Props) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  return (
    <ChartContainer
      config={chartConfig}
      className={cn('max-h-[800px] min-h-[50px] w-full', className)}
    >
      <ComposedChart
        accessibilityLayer
        data={sorted}
        layout="vertical"
        barGap={10}
        barCategoryGap="20%"
        syncId={syncId}
      >
        <CartesianGrid vertical={true} horizontal={false} />
        <ChartLegend content={<ChartLegendContent />} />

        <YAxis
          dataKey="location"
          interval={0}
          type="category"
          axisLine={true}
          tickFormatter={(value) => value}
          width={100}
        />

        <XAxis tickLine={false} allowDecimals={false} type="number" />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dashed" />}
        />
        <Bar
          dataKey="loses"
          stackId="a"
          fill="var(--color-loses)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="wins"
          stackId="a"
          fill="var(--color-wins)"
          radius={[0, 4, 4, 0]}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
