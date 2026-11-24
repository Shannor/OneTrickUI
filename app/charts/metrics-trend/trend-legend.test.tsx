import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChartLegend, ChartLegendItem, TrendLegend } from './trend-legend';

describe('ChartLegend, ChartLegendItem, and TrendLegend', () => {
  it('composes custom ChartLegendItem swatches inside ChartLegend', () => {
    render(
      <ChartLegend ariaLabel="Custom chart legend">
        <ChartLegendItem swatch="outcome-dots" label="Outcome Dots" />
        <ChartLegendItem
          swatch="solid"
          colorClassName="bg-emerald-500"
          label="Rolling Line"
        />
        <ChartLegendItem
          swatch="dashed"
          colorClassName="border-stone-400"
          label="Target Line"
        />
      </ChartLegend>,
    );

    expect(screen.getByLabelText('Custom chart legend')).toBeInTheDocument();
    expect(screen.getByText('Outcome Dots')).toBeInTheDocument();
    expect(screen.getByText('Rolling Line')).toBeInTheDocument();
    expect(screen.getByText('Target Line')).toBeInTheDocument();
  });

  it('renders metric-specific legend items in TrendLegend', () => {
    const { rerender } = render(<TrendLegend activeMetric="kd" />);
    expect(screen.getByText('Match K/D (Win / Loss)')).toBeInTheDocument();
    expect(screen.getByText('1.00 Even K/D')).toBeInTheDocument();

    rerender(<TrendLegend activeMetric="combat" />);
    expect(screen.getByText('5-Game Avg Kills')).toBeInTheDocument();
    expect(screen.getByText('5-Game Avg Assists')).toBeInTheDocument();
    expect(screen.getByText('5-Game Avg Deaths')).toBeInTheDocument();
  });
});
