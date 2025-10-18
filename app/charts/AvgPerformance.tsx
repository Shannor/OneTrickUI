import React from 'react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart';
import {
  type KDAResult,
  type TimeWindow,
  labelFormater,
  tickFormater,
} from '~/lib/metrics';
import { cn } from '~/lib/utils';

interface Props {
  data: KDAResult[];
  timeWindow: TimeWindow;
  className?: string;
  syncId?: string;
}
const chartConfig = {
  avgKills: {
    label: 'Kills',
    color: 'var(--chart-primary)',
  },
  avgDeaths: {
    label: 'Deaths',
    color: 'var(--chart-error)',
  },
  avgAssists: {
    label: 'Assists',
    color: 'var(--chart-secondary)',
  },
} satisfies ChartConfig;
export const AvgPerformance: React.FC<Props> = ({
  data,
  timeWindow,
  className,
  syncId,
}) => {
  return (
    <ChartContainer
      config={chartConfig}
      className={cn('max-h-[400px] min-h-[200px] w-full', className)}
    >
      <LineChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12,
        }}
        syncId={syncId}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => tickFormater(value, timeWindow)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => labelFormater(value, timeWindow)}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="avgKills"
          type="monotone"
          stroke="var(--color-avgKills)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="avgAssists"
          type="monotone"
          stroke="var(--color-avgAssists)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="avgDeaths"
          type="monotone"
          stroke="var(--color-avgDeaths)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
};
