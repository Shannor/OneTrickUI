import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MiniSparkline } from './mini-sparkline';

describe('MiniSparkline', () => {
  it('returns null when fewer than 2 points or more than high-volume threshold', () => {
    const { container, rerender } = render(
      <MiniSparkline values={[1.5]} stroke="#22c55e" />,
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <MiniSparkline
        values={Array.from({ length: 55 }, (_, i) => i)}
        stroke="#22c55e"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders an SVG polyline path when between 2 and 50 values', () => {
    const { container } = render(
      <MiniSparkline values={[1.0, 1.5, 2.0]} stroke="#22c55e" />,
    );
    const path = container.querySelector('svg path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('stroke', '#22c55e');
  });
});
