import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MatchPoint, TelemetrySummary } from '~/lib/metrics';

import { TrendKpiTabs } from './trend-kpi-tabs';

const summary: TelemetrySummary = {
  games: 10,
  wins: 6,
  losses: 4,
  winPct: 60,
  kills: 150,
  deaths: 100,
  assists: 50,
  avgKills: 15,
  avgDeaths: 10,
  avgAssists: 5,
  kd: 1.5,
  kda: 2.0,
  kdDelta: 0.2,
  kdaDelta: -0.1,
  winPctDelta: 10,
};

const sparkPoints: MatchPoint[] = [
  {
    matchIndex: 1,
    activityId: 'a1',
    time: '2026-11-01T12:00:00Z',
    shortLabel: '#1',
    fullLabel: 'Match #1',
    location: 'Eternity',
    kills: 15,
    deaths: 10,
    assists: 5,
    won: true,
    kd: 1.5,
    kda: 2.0,
    winPct: 100,
    rollingKd: 1.4,
    rollingKda: 1.9,
    rollingWinPct: 50,
    rollingKills: 14,
    rollingDeaths: 10,
    rollingAssists: 5,
    kdBand: [1.4, 1.4],
    kdaBand: [1.9, 1.9],
    killsBand: [14, 14],
  },
  {
    matchIndex: 2,
    activityId: 'a2',
    time: '2026-11-02T12:00:00Z',
    shortLabel: '#2',
    fullLabel: 'Match #2',
    location: 'Eternity',
    kills: 16,
    deaths: 10,
    assists: 5,
    won: true,
    kd: 1.6,
    kda: 2.1,
    rollingKd: 1.5,
    rollingKda: 2.0,
    rollingWinPct: 60,
    rollingKills: 15,
    rollingDeaths: 10,
    rollingAssists: 5,
    winPct: 100,
    kdBand: [1.4, 1.6],
    kdaBand: [1.9, 2.1],
    killsBand: [14, 16],
  },
];

describe('TrendKpiTabs', () => {
  it('renders interactive KPI tabs and fires onSelectMetric', () => {
    const onSelectMetric = vi.fn();

    render(
      <TrendKpiTabs
        summary={summary}
        sparkPoints={sparkPoints}
        activeMetric="kd"
        onSelectMetric={onSelectMetric}
        isSummaryOnly={false}
      />,
    );

    expect(screen.getByText('1.50')).toBeInTheDocument();
    expect(screen.getByText('+0.2')).toBeInTheDocument();
    expect(screen.getByText('6W–4L (+10%)')).toBeInTheDocument();
    expect(screen.getByText('2.00')).toHaveClass('text-sky-600');
    expect(screen.getByText('2.00')).not.toHaveClass('text-amber-600');

    fireEvent.click(screen.getByRole('tab', { name: /Efficiency/i }));
    expect(onSelectMetric).toHaveBeenCalledWith('kda');
  });

  it('renders non-interactive summary cells without sparklines when isSummaryOnly is true', () => {
    const { container } = render(
      <TrendKpiTabs
        summary={summary}
        sparkPoints={sparkPoints}
        activeMetric="kd"
        onSelectMetric={vi.fn()}
        isSummaryOnly
      />,
    );

    expect(
      screen.getByLabelText('Performance summary stats'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(container.querySelectorAll('svg')).toHaveLength(0);
  });
});
