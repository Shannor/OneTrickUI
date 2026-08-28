'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart';
import { cn } from '~/lib/utils';

const chartConfig = {
  desktop: {
    label: 'Stats',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export type ClassStatData = {
  stat: string;
  value: number;
};

export interface ClassStatsRadarProps {
  className?: string;
  data?: ClassStatData[];
  maxValue?: number;
}

export function ClassStatsRadar({ className, data }: ClassStatsRadarProps) {
  if (!data || data.length === 0) return null;
  const isNew = Boolean(data.find((it) => it.stat.toLowerCase() === 'super'));

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('max-h-[500px] min-h-[50px]', className)}
    >
      <RadarChart data={data}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarRadiusAxis
          angle={30}
          domain={[0, isNew ? 200 : 100]}
          tickLine={false}
          axisLine={false}
          tick={false}
        />
        <PolarAngleAxis
          dataKey="stat"
          tick={({ x, y, textAnchor, index, ...props }) => {
            const d = data[index];
            return (
              <text
                x={x}
                y={index === 0 ? y - 10 : y}
                textAnchor={textAnchor}
                fontSize={13}
                fontWeight={500}
                {...props}
              >
                <tspan className="fill-black dark:fill-white">{d.value}</tspan>
                &nbsp;
                <tspan className="fill-black dark:fill-white">/</tspan>
                &nbsp;
                <tspan className="fill-black dark:fill-white">
                  {isNew ? 200 : 100}
                </tspan>
                <tspan
                  x={x}
                  dy={'1rem'}
                  fontSize={12}
                  className="fill-muted-foreground"
                >
                  {d.stat}
                </tspan>
              </text>
            );
          }}
        />
        <PolarGrid />
        <Radar dataKey="value" fill="var(--color-desktop)" fillOpacity={0.6} />
      </RadarChart>
    </ChartContainer>
  );
}
