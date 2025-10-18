'use client';

import React from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
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

export const description = 'A multiple bar chart';

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const chartConfig = {
  kd: {
    label: 'K/D',
    color: 'var(--chart-primary)',
  },
  kda: {
    label: 'Efficiency',
    color: 'var(--chart-secondary)',
  },
  count: {
    label: 'Games Played',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

interface Props {
  className?: string;
  data: MapResult[];
  timeWindow?: TimeWindow;
}
export function MapPerformance({ className, data }: Props) {
  return (
    <ChartContainer
      config={chartConfig}
      className={cn('max-h-[400px] min-h-[200px] w-full', className)}
    >
      <ComposedChart accessibilityLayer data={data}>
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
        <Bar dataKey="kd" fill="var(--color-kd)" radius={4} />
        <Bar dataKey="kda" fill="var(--color-kda)" radius={4} />
        <Line type="monotone" dataKey="count" fill="var(--color-count)" />
      </ComposedChart>
    </ChartContainer>
  );
}
