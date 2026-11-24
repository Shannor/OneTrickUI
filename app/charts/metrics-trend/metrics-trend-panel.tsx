import { useMemo, useState } from 'react';
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
  EVEN_KD_TARGET,
  EVEN_WIN_RATE_PCT,
  MAX_WIN_RATE_PCT,
  type MatchPoint,
  TARGET_EFFICIENCY_KDA,
  type TelemetrySummary,
  summarizeMatchSamples,
} from '~/lib/metrics';
import { cn } from '~/lib/utils';

import {
  ACTIVE_OUTCOME_DOT_RADIUS,
  HIGH_VOLUME_MATCH_THRESHOLD,
  MAX_COMBAT_DOT_POINTS,
  MEDIUM_MATCH_WINDOW,
  METRIC_METADATA,
  type MatchWindowPreset,
  type TrendMetricKey,
  WIN_PCT_DOT_RADIUS,
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
  const seriesKey = `${seriesSignature}|${hideKpiTabs}`;
  const [prevSeriesKey, setPrevSeriesKey] = useState(seriesKey);
  const [activeMetric, setActiveMetric] = useState<TrendMetricKey>('kd');
  const [windowPreset, setWindowPreset] = useState<MatchWindowPreset>(() =>
    getDefaultWindowPreset(points.length, hideKpiTabs),
  );

  if (seriesKey !== prevSeriesKey) {
    setPrevSeriesKey(seriesKey);
    setWindowPreset(getDefaultWindowPreset(points.length, hideKpiTabs));
  }

  const visibleData = useMemo(
    () => slicePointsForWindow(points, windowPreset),
    [points, windowPreset],
  );

  const brushResetKey = `${seriesKey}|${visibleData.length}`;
  const [prevBrushResetKey, setPrevBrushResetKey] = useState(brushResetKey);
  const [brushRange, setBrushRange] = useState<{
    startIndex: number;
    endIndex: number;
  }>(() => ({
    startIndex: 0,
    endIndex: Math.max(0, visibleData.length - 1),
  }));

  if (brushResetKey !== prevBrushResetKey) {
    setPrevBrushResetKey(brushResetKey);
    setBrushRange({
      startIndex: 0,
      endIndex: Math.max(0, visibleData.length - 1),
    });
  }

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

  if (points.length === 0) {
    return null;
  }

  const isSummaryOnly =
    !hideKpiTabs && isHighVolume && windowPreset === 'summary';
  const showBrush =
    !isHighVolume &&
    windowPreset === 'all' &&
    visibleData.length > MEDIUM_MATCH_WINDOW;
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
            className="aspect-auto h-56 w-full sm:h-64 lg:h-72"
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
                domain={
                  activeMetric === 'winPct'
                    ? [0, MAX_WIN_RATE_PCT]
                    : [0, 'auto']
                }
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
                  y={EVEN_KD_TARGET}
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
                  activeDot={
                    <MatchOutcomeDot radius={ACTIVE_OUTCOME_DOT_RADIUS} />
                  }
                  isAnimationActive={false}
                />
              )}

              {activeMetric === 'kda' && (
                <ReferenceLine
                  y={TARGET_EFFICIENCY_KDA}
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
                  activeDot={
                    <MatchOutcomeDot radius={ACTIVE_OUTCOME_DOT_RADIUS} />
                  }
                  isAnimationActive={false}
                />
              )}

              {activeMetric === 'winPct' && (
                <ReferenceLine
                  y={EVEN_WIN_RATE_PCT}
                  stroke="#78716c"
                  strokeDasharray="4 4"
                />
              )}
              {activeMetric === 'winPct' && (
                <Area
                  type="linear"
                  dataKey="rollingWinPct"
                  stroke="var(--color-rollingWinPct)"
                  strokeWidth={2.5}
                  fill="var(--color-rollingWinPct)"
                  fillOpacity={0.1}
                  dot={<MatchOutcomeDot radius={WIN_PCT_DOT_RADIUS} />}
                  activeDot={
                    <MatchOutcomeDot radius={ACTIVE_OUTCOME_DOT_RADIUS} />
                  }
                  isAnimationActive={false}
                />
              )}

              {activeMetric === 'combat' && (
                <Line
                  type="linear"
                  dataKey="rollingKills"
                  stroke="var(--color-rollingKills)"
                  strokeWidth={2.2}
                  dot={visibleData.length <= MAX_COMBAT_DOT_POINTS}
                  isAnimationActive={false}
                />
              )}
              {activeMetric === 'combat' && (
                <Line
                  type="linear"
                  dataKey="rollingAssists"
                  stroke="var(--color-rollingAssists)"
                  strokeWidth={2}
                  dot={visibleData.length <= MAX_COMBAT_DOT_POINTS}
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
                  dot={visibleData.length <= MAX_COMBAT_DOT_POINTS}
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
