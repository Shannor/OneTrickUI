import { HIGH_VOLUME_MATCH_THRESHOLD } from './metrics-trend-config';

export interface MiniSparklineProps {
  values: number[];
  stroke: string;
}

export function MiniSparkline({ values, stroke }: MiniSparklineProps) {
  if (values.length < 2 || values.length > HIGH_VOLUME_MATCH_THRESHOLD) {
    return null;
  }

  const width = 88;
  const height = 26;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const path = values
    .map((value, idx) => {
      const x = (idx / (values.length - 1)) * width;
      const y = height - 2 - ((value - min) / span) * (height - 4);
      return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="hidden shrink-0 lg:block"
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} />
    </svg>
  );
}
