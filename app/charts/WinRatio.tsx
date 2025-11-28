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
  type CustomTimeWindow,
  type KDAResult,
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
  winRatio: {
    label: 'Win Ratio',
    color: 'var(--chart-primary)',
  },
} satisfies ChartConfig;

export const WinRatio: React.FC<Props> = ({
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
          top: 12,
          right: 12,
        }}
        syncId={syncId}
      >
        <CartesianGrid vertical={false} horizontal={true} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={1}
          tickFormatter={(value) => tickFormater(value, timeWindow)}
        />
        <YAxis
          domain={[0, 1]}
          ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          interval={0}
          tickMargin={10}
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
          dataKey="winRatio"
          type="monotone"
          stroke="var(--color-winRatio)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
};
