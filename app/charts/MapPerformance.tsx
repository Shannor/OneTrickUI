'use client';

import React from 'react';
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart';
import type { MapResult, TimeWindow } from '~/lib/metrics';
import { cn } from '~/lib/utils';

const chartConfig = {
  kd: {
    label: 'K/D',
    color: 'var(--chart-primary)',
  },
  kda: {
    label: 'Efficiency',
    color: 'var(--chart-secondary)',
  },
} satisfies ChartConfig;

interface Props {
  className?: string;
  data: MapResult[];
  timeWindow?: TimeWindow;
  syncId?: string;
}
export function MapPerformance({ className, data, syncId }: Props) {
  return (
    <ChartContainer
      config={chartConfig}
      className={cn('max-h-[400px] min-h-[200px] w-full', className)}
    >
      <ComposedChart accessibilityLayer data={data} syncId={syncId}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="location"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value}
        />
        <ChartLegend content={<ChartLegendContent />} />

        <YAxis tickCount={5} tickLine={true} allowDecimals={false} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dashed" />}
        />
        <Line dataKey="kd" type="monotone" fill="var(--color-kd)" />
        <Line dataKey="kda" type="monotone" fill="var(--color-kda)" />
      </ComposedChart>
    </ChartContainer>
  );
}
