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
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('max-h-[400px] min-h-[200px] w-full', className)}
    >
      <ComposedChart
        accessibilityLayer
        data={sorted}
        syncId={syncId}
        layout="vertical"
        barCategoryGap="10%"
      >
        <CartesianGrid vertical={false} />
        <YAxis
          type="category"
          dataKey="location"
          interval={0}
          width={100}
          axisLine={false}
          tickFormatter={(value) => value}
        />
        <ChartLegend content={<ChartLegendContent />} />

        <XAxis
          tickCount={5}
          type="number"
          tickLine={false}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dashed" />}
        />
        <Bar
          dataKey="kd"
          type="monotone"
          radius={2}
          fill="var(--color-kd)"
          barSize={10}
        />
        <Bar
          dataKey="kda"
          type="monotone"
          radius={2}
          fill="var(--color-kda)"
          barSize={10}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
