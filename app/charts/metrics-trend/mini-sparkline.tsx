import {
  HIGH_VOLUME_MATCH_THRESHOLD,
  MIN_SPARKLINE_POINTS,
  SPARKLINE_HEIGHT,
  SPARKLINE_VERTICAL_PADDING,
  SPARKLINE_WIDTH,
} from './metrics-trend-config';

export interface MiniSparklineProps {
  values: number[];
  stroke: string;
}

export function MiniSparkline({ values, stroke }: MiniSparklineProps) {
  if (
    values.length < MIN_SPARKLINE_POINTS ||
    values.length > HIGH_VOLUME_MATCH_THRESHOLD
  ) {
    return null;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const drawableHeight = SPARKLINE_HEIGHT - SPARKLINE_VERTICAL_PADDING * 2;
  const path = values
    .map((value, idx) => {
      const x = (idx / (values.length - 1)) * SPARKLINE_WIDTH;
      const y =
        SPARKLINE_HEIGHT -
        SPARKLINE_VERTICAL_PADDING -
        ((value - min) / span) * drawableHeight;
      return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={SPARKLINE_WIDTH}
      height={SPARKLINE_HEIGHT}
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      aria-hidden="true"
      className="hidden shrink-0 lg:block"
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} />
    </svg>
  );
}
