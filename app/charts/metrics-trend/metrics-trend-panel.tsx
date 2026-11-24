import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer, ChartTooltip } from '~/components/ui/chart';
import {
  type MatchPoint,
  type TelemetrySummary,
  summarizeMatchSamples,
} from '~/lib/metrics';
import { cn } from '~/lib/utils';

import {
  HIGH_VOLUME_MATCH_THRESHOLD,
  METRIC_METADATA,
  type MatchWindowPreset,
  type TrendMetricKey,
  getDefaultWindowPreset,
  metricsTrendChartConfig,
  slicePointsForWindow,
} from './metrics-trend-config';
import { TrendChartHeader } from './trend-chart-header';
import { TrendKpiTabs } from './trend-kpi-tabs';
import { MatchOutcomeDot, TrendTooltipContent } from './trend-tooltip';
import { HighVolumeSummaryBar } from './window-preset-pills';

export interface MetricsTrendPanelProps {
  points: MatchPoint[];
  summary: TelemetrySummary;
  hideKpiTabs?: boolean;
  titleOverride?: string;
  syncId?: string;
  className?: string;
}

export function MetricsTrendPanel({
  points,
  summary,
  hideKpiTabs = false,
  titleOverride,
  syncId,
  className,
}: MetricsTrendPanelProps) {
  const isHighVolume = points.length > HIGH_VOLUME_MATCH_THRESHOLD;
  const seriesSignature = useMemo(
    () => points.map((p) => `${p.activityId}:${p.time}`).join('|'),
    [points],
  );
  const [activeMetric, setActiveMetric] = useState<TrendMetricKey>('kd');
  const [windowPreset, setWindowPreset] = useState<MatchWindowPreset>(() =>
    getDefaultWindowPreset(points.length, hideKpiTabs),
  );
  const [brushRange, setBrushRange] = useState<{
    startIndex: number;
    endIndex: number;
  }>(() => ({
    startIndex: 0,
    endIndex: Math.max(0, points.length - 1),
  }));

  useEffect(() => {
    setWindowPreset(getDefaultWindowPreset(points.length, hideKpiTabs));
    setBrushRange({
      startIndex: 0,
      endIndex: Math.max(0, points.length - 1),
    });
  }, [seriesSignature, points.length, hideKpiTabs]);

  const visibleData = useMemo(
    () => slicePointsForWindow(points, windowPreset),
    [points, windowPreset],
  );

  const displayedSummary = useMemo(() => {
    if (
      (windowPreset === '10' || windowPreset === '25') &&
      visibleData.length > 0 &&
      visibleData.length < points.length
    ) {
      const cutoff = points.length - visibleData.length;
      const priorSlice = points.slice(
        Math.max(0, cutoff - visibleData.length),
        cutoff,
      );
      return summarizeMatchSamples(visibleData, priorSlice);
    }
    return summary;
  }, [points, summary, visibleData, windowPreset]);

  useEffect(() => {
    setBrushRange({
      startIndex: 0,
      endIndex: Math.max(0, visibleData.length - 1),
    });
  }, [visibleData.length]);

  if (points.length === 0) {
    return null;
  }

  const isSummaryOnly =
    !hideKpiTabs && isHighVolume && windowPreset === 'summary';
  const showBrush =
    !isHighVolume && windowPreset === 'all' && visibleData.length > 25;
  const meta = METRIC_METADATA[activeMetric];

  return (
    <section
      className={cn(
        'flex flex-col gap-3 border-0 bg-transparent md:gap-0 md:overflow-hidden md:rounded-xl md:border md:border-border md:bg-card',
        className,
      )}
    >
      {!hideKpiTabs && (
        <TrendKpiTabs
          summary={displayedSummary}
          sparkPoints={visibleData}
          activeMetric={activeMetric}
          onSelectMetric={setActiveMetric}
          isSummaryOnly={isSummaryOnly}
        />
      )}

      {isSummaryOnly ? (
        <HighVolumeSummaryBar
          totalMatches={points.length}
          windowPreset={windowPreset}
          onSelectPreset={setWindowPreset}
        />
      ) : (
        <div className="flex flex-col gap-3 md:p-5">
          <TrendChartHeader
            title={titleOverride ?? meta.title}
            subtitle={meta.subtitle}
            activeMetric={activeMetric}
            totalMatches={points.length}
            isHighVolume={isHighVolume}
            allowSummaryPreset={!hideKpiTabs}
            windowPreset={windowPreset}
            onSelectPreset={setWindowPreset}
            compactMetricPicker={
              hideKpiTabs
                ? { activeMetric, onSelectMetric: setActiveMetric }
                : undefined
            }
          />

          <ChartContainer
            config={metricsTrendChartConfig}
            className="aspect-auto h-[230px] w-full sm:h-[260px] lg:h-[290px]"
          >
            <ComposedChart
              accessibilityLayer
              data={visibleData}
              syncId={syncId}
              margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="shortLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={36}
                domain={activeMetric === 'winPct' ? [0, 100] : [0, 'auto']}
                tickFormatter={(val) =>
                  activeMetric === 'winPct' ? `${val}%` : `${val}`
                }
              />
              <ChartTooltip
                cursor={{
                  stroke: 'hsl(var(--border))',
                  strokeDasharray: '3 3',
                }}
                content={<TrendTooltipContent activeMetric={activeMetric} />}
              />

              {activeMetric === 'kd' && (
                <ReferenceLine
                  y={1}
                  stroke="#78716c"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
              )}
              {activeMetric === 'kd' && (
                <Line
                  type="linear"
                  dataKey="rollingKd"
                  stroke="var(--color-rollingKd)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}
              {activeMetric === 'kd' && (
                <Line
                  type="linear"
                  dataKey="kd"
                  stroke="transparent"
                  dot={<MatchOutcomeDot />}
                  activeDot={<MatchOutcomeDot radius={5} />}
                  isAnimationActive={false}
                />
              )}

              {activeMetric === 'kda' && (
                <ReferenceLine
                  y={1.5}
                  stroke="#78716c"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
              )}
              {activeMetric === 'kda' && (
                <Line
                  type="linear"
                  dataKey="rollingKda"
                  stroke="var(--color-rollingKda)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}
              {activeMetric === 'kda' && (
                <Line
                  type="linear"
                  dataKey="kda"
                  stroke="transparent"
                  dot={<MatchOutcomeDot />}
                  activeDot={<MatchOutcomeDot radius={5} />}
                  isAnimationActive={false}
                />
              )}

              {activeMetric === 'winPct' && (
                <ReferenceLine y={50} stroke="#78716c" strokeDasharray="4 4" />
              )}
              {activeMetric === 'winPct' && (
                <Area
                  type="linear"
                  dataKey="rollingWinPct"
                  stroke="var(--color-rollingWinPct)"
                  strokeWidth={2.5}
                  fill="var(--color-rollingWinPct)"
                  fillOpacity={0.1}
                  dot={<MatchOutcomeDot radius={3} />}
                  activeDot={<MatchOutcomeDot radius={5} />}
                  isAnimationActive={false}
                />
              )}

              {activeMetric === 'combat' && (
                <Line
                  type="linear"
                  dataKey="rollingKills"
                  stroke="var(--color-rollingKills)"
                  strokeWidth={2.2}
                  dot={visibleData.length <= 4}
                  isAnimationActive={false}
                />
              )}
              {activeMetric === 'combat' && (
                <Line
                  type="linear"
                  dataKey="rollingAssists"
                  stroke="var(--color-rollingAssists)"
                  strokeWidth={2}
                  dot={visibleData.length <= 4}
                  isAnimationActive={false}
                />
              )}
              {activeMetric === 'combat' && (
                <Line
                  type="linear"
                  dataKey="rollingDeaths"
                  stroke="var(--color-rollingDeaths)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={visibleData.length <= 4}
                  isAnimationActive={false}
                />
              )}

              {showBrush && (
                <Brush
                  dataKey="shortLabel"
                  height={20}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--secondary))"
                  travellerWidth={8}
                  startIndex={brushRange.startIndex}
                  endIndex={brushRange.endIndex}
                  onChange={(nextRange) => {
                    if (
                      typeof nextRange?.startIndex === 'number' &&
                      typeof nextRange?.endIndex === 'number'
                    ) {
                      setBrushRange({
                        startIndex: nextRange.startIndex,
                        endIndex: nextRange.endIndex,
                      });
                    }
                  }}
                />
              )}
            </ComposedChart>
          </ChartContainer>
        </div>
      )}
    </section>
  );
}
