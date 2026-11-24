import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CompactMetricPicker, TrendChartHeader } from './trend-chart-header';

describe('CompactMetricPicker and TrendChartHeader', () => {
  it('switches metrics via CompactMetricPicker', () => {
    const onSelectMetric = vi.fn();
    render(
      <CompactMetricPicker activeMetric="kd" onSelectMetric={onSelectMetric} />,
    );

    expect(screen.getByRole('button', { name: 'K/D' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Win %' }));
    expect(onSelectMetric).toHaveBeenCalledWith('winPct');
  });

  it('renders title, subtitle, legend, and optional compact picker in TrendChartHeader', () => {
    const onSelectMetric = vi.fn();
    const onSelectPreset = vi.fn();

    render(
      <TrendChartHeader
        title="Session Performance Graph"
        subtitle="Rolling 5-game consistency"
        activeMetric="kda"
        totalMatches={20}
        isHighVolume={false}
        windowPreset="all"
        onSelectPreset={onSelectPreset}
        compactMetricPicker={{
          activeMetric: 'kda',
          onSelectMetric,
        }}
      />,
    );

    expect(screen.getByText('Session Performance Graph')).toBeInTheDocument();
    expect(
      screen.getByText('Match Efficiency (Win / Loss)'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'K/D/A' }));
    expect(onSelectMetric).toHaveBeenCalledWith('combat');
  });
});
