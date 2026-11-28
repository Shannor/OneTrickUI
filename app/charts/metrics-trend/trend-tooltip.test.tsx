import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MatchPoint } from '~/lib/metrics';

import {
  MatchOutcomeDot,
  TrendTooltipContent,
  TrendTooltipRow,
} from './trend-tooltip';

const samplePoint: MatchPoint = {
  matchIndex: 7,
  activityId: 'act-7',
  time: '2026-11-10T12:00:00Z',
  shortLabel: '#7 · Nov 10',
  fullLabel: 'Match #7 · Javelin-4',
  location: 'Javelin-4',
  kills: 20,
  deaths: 10,
  assists: 5,
  won: true,
  kd: 2.0,
  kda: 2.5,
  winPct: 100,
  rollingKd: 1.75,
  rollingKda: 2.15,
  rollingWinPct: 80,
  rollingKills: 18,
  rollingDeaths: 10,
  rollingAssists: 6,
  kdBand: [1.2, 2.0],
  kdaBand: [1.5, 2.5],
  killsBand: [14, 20],
};

describe('MatchOutcomeDot, TrendTooltipRow, and TrendTooltipContent', () => {
  it('renders win/loss colored circle in MatchOutcomeDot', () => {
    const { container, rerender } = render(
      <svg>
        <MatchOutcomeDot cx={10} cy={20} payload={samplePoint} />
      </svg>,
    );
    expect(container.querySelector('circle')).toHaveAttribute(
      'fill',
      '#22c55e',
    );

    rerender(
      <svg>
        <MatchOutcomeDot
          cx={10}
          cy={20}
          payload={{ ...samplePoint, won: false }}
        />
      </svg>,
    );
    expect(container.querySelector('circle')).toHaveAttribute(
      'fill',
      '#ef4444',
    );
  });

  it('renders TrendTooltipRow with optional detail', () => {
    render(
      <TrendTooltipRow
        label="This Match K/D"
        value="2.00"
        detail="(20K / 10D / 5A)"
      />,
    );
    expect(screen.getByText('This Match K/D')).toBeInTheDocument();
    expect(screen.getByText('(20K / 10D / 5A)')).toBeInTheDocument();
  });

  it('renders active TrendTooltipContent for each metric and returns null when inactive', () => {
    const { container, rerender } = render(
      <TrendTooltipContent active={false} activeMetric="kd" />,
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <TrendTooltipContent
        active
        payload={[{ payload: samplePoint }]}
        activeMetric="kd"
      />,
    );
    expect(screen.getByText('Match #7 · Javelin-4')).toBeInTheDocument();
    expect(screen.getByText('Win')).toBeInTheDocument();
    expect(screen.getByText('1.75')).toBeInTheDocument();

    rerender(
      <TrendTooltipContent
        active
        payload={[{ payload: samplePoint }]}
        activeMetric="kda"
      />,
    );
    expect(screen.getByText('2.15')).toHaveClass('text-sky-600');
    expect(screen.getByText('2.15')).not.toHaveClass('text-amber-600');

    rerender(
      <TrendTooltipContent
        active
        payload={[{ payload: samplePoint }]}
        activeMetric="winPct"
      />,
    );
    expect(screen.getByText('80%')).toBeInTheDocument();
  });
});
