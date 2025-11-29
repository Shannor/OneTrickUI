import React from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
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
  type CustomTimeWindow,
  labelFormater,
  tickFormater,
} from '~/lib/metrics';
import { cn } from '~/lib/utils';

interface Props {
  data: KDAResult[];
  timeWindow: CustomTimeWindow;
  className?: string;
  syncId?: string;
}
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

export const KDPerformance: React.FC<Props> = ({
  data,
  timeWindow,
  className,
  syncId,
}) => {
  return (
    <ChartContainer
      config={chartConfig}
      className={cn('max-h-[400px] min-h-[50px] w-full', className)}
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
        <CartesianGrid vertical={false} horizontal={true} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => tickFormater(value, timeWindow)}
        />
        <YAxis
          tickMargin={8}
          tickCount={5}
          tickLine={true}
          allowDecimals={false}
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
          dataKey="kd"
          type="monotone"
          stroke="var(--color-kd)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="kda"
          type="monotone"
          stroke="var(--color-kda)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
};
