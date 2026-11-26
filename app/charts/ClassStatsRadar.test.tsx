import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ClassStatsRadar } from './ClassStatsRadar';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;
}

describe('ClassStatsRadar', () => {
  const mockData = [
    { stat: 'Mobility', value: 70 },
    { stat: 'Resilience', value: 100 },
  ];

  it('renders radar chart container when data is provided', () => {
    const { container } = render(<ClassStatsRadar data={mockData} />);
    const chartEl = container.querySelector('[data-chart]');
    expect(chartEl).not.toBeNull();
    expect(chartEl).toHaveClass(
      'w-full',
      'min-w-0',
      'min-h-[280px]',
      'sm:min-h-[320px]',
    );
  });

  it('merges custom className onto the chart container', () => {
    const { container } = render(
      <ClassStatsRadar data={mockData} className="lg:flex-1" />,
    );
    const chartEl = container.querySelector('[data-chart]');
    expect(chartEl).toHaveClass('w-full', 'lg:flex-1');
  });

  it('returns null when data is empty or undefined', () => {
    const { container } = render(<ClassStatsRadar data={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
