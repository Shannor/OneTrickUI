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
    expect(container.firstChild).not.toBeNull();
  });

  it('returns null when data is empty or undefined', () => {
    const { container } = render(<ClassStatsRadar data={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
