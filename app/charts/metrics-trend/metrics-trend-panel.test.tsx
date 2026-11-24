import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MatchPoint, TelemetrySummary } from '~/lib/metrics';

import { MetricsTrendPanel } from './metrics-trend-panel';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;
}

const mockPoints: MatchPoint[] = Array.from({ length: 14 }, (_, idx) => ({
  matchIndex: idx + 1,
  activityId: `act-${idx + 1}`,
  time: `2026-11-${String(idx + 1).padStart(2, '0')}T12:00:00Z`,
  shortLabel: `#${idx + 1} · Nov ${idx + 1}`,
  fullLabel: `Match #${idx + 1} · Eternity`,
  location: 'Eternity',
  kills: 16,
  deaths: 10,
  assists: 6,
  won: idx % 2 === 0,
  kd: 1.6,
  kda: 2.2,
  winPct: idx % 2 === 0 ? 100 : 0,
  rollingKd: 1.6,
  rollingKda: 2.2,
  rollingWinPct: 50,
  rollingKills: 16,
  rollingDeaths: 10,
  rollingAssists: 6,
  kdBand: [1.2, 2.0],
  kdaBand: [1.6, 2.6],
  killsBand: [12, 20],
}));

const mockSummary: TelemetrySummary = {
  games: 14,
  wins: 7,
  losses: 7,
  winPct: 50,
  kills: 224,
  deaths: 140,
  assists: 84,
  avgKills: 16,
  avgDeaths: 10,
  avgAssists: 6,
  kd: 1.6,
  kda: 2.2,
  kdDelta: 0.18,
  kdaDelta: 0.24,
  winPctDelta: 8,
};

describe('MetricsTrendPanel', () => {
  it('renders KPI tabs, explicit legend, switches active metric titles, and supports window range presets', () => {
    render(<MetricsTrendPanel points={mockPoints} summary={mockSummary} />);

    expect(screen.getByText('1.60')).toBeInTheDocument();
    expect(screen.getByText('2.20')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('K/D Ratio by Match')).toBeInTheDocument();
    expect(screen.getByText('Match K/D (Win / Loss)')).toBeInTheDocument();
    expect(screen.getByText('Your 5-Game Avg')).toBeInTheDocument();
    expect(screen.getByText('1.00 Even K/D')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Efficiency/i }));
    expect(screen.getByText('Efficiency (KDA) by Match')).toBeInTheDocument();
    expect(
      screen.getByText('Match Efficiency (Win / Loss)'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Win Percentage/i }));
    expect(screen.getByText('5-Game Rolling Win Rate')).toBeInTheDocument();
    expect(screen.getByText('50% Even Win Rate')).toBeInTheDocument();

    const last10Btn = screen.getByRole('button', { name: 'Last 10g' });
    fireEvent.click(last10Btn);
    expect(last10Btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports hideKpiTabs mode with titleOverride for embedded session overview', () => {
    render(
      <MetricsTrendPanel
        points={mockPoints.slice(0, 3)}
        summary={mockSummary}
        hideKpiTabs
        titleOverride="Session Performance Graph"
      />,
    );

    expect(screen.getByText('Session Performance Graph')).toBeInTheDocument();
    expect(
      screen.queryByRole('tablist', { name: 'Performance metric selector' }),
    ).not.toBeInTheDocument();
  });

  it('returns null when points array is empty', () => {
    const { container } = render(
      <MetricsTrendPanel points={[]} summary={mockSummary} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('defaults to numbers-only Summary Only mode without sparklines or chart when match count exceeds 50, and reveals chart on Last 25g', () => {
    const highVolumePoints: MatchPoint[] = Array.from(
      { length: 65 },
      (_, idx) => ({
        ...mockPoints[0],
        matchIndex: idx + 1,
        activityId: `act-${idx + 1}`,
        shortLabel: `#${idx + 1}`,
        fullLabel: `Match #${idx + 1}`,
      }),
    );
    const highVolumeSummary: TelemetrySummary = {
      ...mockSummary,
      games: 65,
    };

    const { container } = render(
      <MetricsTrendPanel
        points={highVolumePoints}
        summary={highVolumeSummary}
      />,
    );

    expect(
      screen.getByLabelText('Performance summary stats'),
    ).toBeInTheDocument();
    expect(screen.queryByText('K/D Ratio by Match')).not.toBeInTheDocument();
    expect(container.querySelectorAll('svg')).toHaveLength(0);

    const summaryOnlyBtn = screen.getByRole('button', { name: 'Summary Only' });
    expect(summaryOnlyBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Last 25g' }));
    expect(screen.getByText('K/D Ratio by Match')).toBeInTheDocument();
    expect(screen.getByText('Match K/D (Win / Loss)')).toBeInTheDocument();
    expect(
      screen.getByRole('tablist', { name: 'Performance metric selector' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Summary Only' }));
    expect(screen.queryByText('K/D Ratio by Match')).not.toBeInTheDocument();
  });

  it('defaults high-volume hideKpiTabs panels to Last 25g and omits Summary Only preset', () => {
    const highVolumePoints: MatchPoint[] = Array.from(
      { length: 65 },
      (_, idx) => ({
        ...mockPoints[0],
        matchIndex: idx + 1,
        activityId: `act-${idx + 1}`,
        shortLabel: `#${idx + 1}`,
        fullLabel: `Match #${idx + 1}`,
      }),
    );

    render(
      <MetricsTrendPanel
        points={highVolumePoints}
        summary={{ ...mockSummary, games: 65 }}
        hideKpiTabs
        titleOverride="Session Performance Graph"
      />,
    );

    expect(screen.getByText('Session Performance Graph')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Summary Only' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last 25g' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Last 10g' }),
    ).toBeInTheDocument();
  });

  it('compares Last 10g against the immediately preceding 10 matches instead of full career history', () => {
    const careerPoints: MatchPoint[] = Array.from({ length: 30 }, (_, idx) => {
      const kills = idx < 10 ? 4 : idx < 20 ? 12 : 17;
      return {
        ...mockPoints[0],
        matchIndex: idx + 1,
        activityId: `career-${idx + 1}`,
        kills,
        deaths: 10,
        assists: 0,
        kd: kills / 10,
        kda: kills / 10,
      };
    });

    render(
      <MetricsTrendPanel
        points={careerPoints}
        summary={{ ...mockSummary, games: 30, kdDelta: null }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Last 10g' }));
    expect(screen.getAllByText('+0.5').length).toBeGreaterThan(0);
  });

  it('resets windowPreset when switching to a distinct series of the same match count', () => {
    const { rerender } = render(
      <MetricsTrendPanel points={mockPoints} summary={mockSummary} />,
    );

    const last10Btn = screen.getByRole('button', { name: 'Last 10g' });
    fireEvent.click(last10Btn);
    expect(last10Btn).toHaveAttribute('aria-pressed', 'true');

    const trialsPoints = mockPoints.map((pt, idx) => ({
      ...pt,
      activityId: `trials-${idx + 1}`,
    }));

    rerender(<MetricsTrendPanel points={trialsPoints} summary={mockSummary} />);

    expect(screen.getByRole('button', { name: 'All Matches' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
