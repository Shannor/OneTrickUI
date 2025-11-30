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
  count: {
    label: 'Games Played',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

interface Props {
  className?: string;
  data: MapResult[];
  timeWindow?: CustomTimeWindow;
  syncId?: string;
}
export function MapCount({ className, data, syncId }: Props) {
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
        <Bar dataKey="count" fill="var(--color-count)" radius={2} />
      </ComposedChart>
    </ChartContainer>
  );
}
