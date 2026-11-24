import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { KdBulletBar, MapSignalPill, WinRateBar } from './map-signal-pill';

describe('MapSignalPill, KdBulletBar, and WinRateBar', () => {
  it('renders accessible labels and tone classes for each MapSignal', () => {
    const { rerender } = render(<MapSignalPill signal="strong" />);
    expect(screen.getByText('Strong')).toHaveClass(
      'text-emerald-600',
      'dark:text-emerald-400',
    );

    rerender(<MapSignalPill signal="swap" />);
    expect(screen.getByText('Swap')).toHaveClass(
      'text-red-600',
      'dark:text-red-400',
    );

    rerender(<MapSignalPill signal="low-sample" />);
    expect(screen.getByText('1g')).toBeInTheDocument();

    rerender(<MapSignalPill signal="neutral" />);
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('renders KdBulletBar fill color and compact sizing based on K/D', () => {
    const { container, rerender } = render(<KdBulletBar kd={1.5} />);
    expect(container.querySelector('.bg-emerald-500')).toHaveStyle({
      width: '50%',
    });

    rerender(<KdBulletBar kd={0.6} compact />);
    expect(container.firstChild).toHaveClass('w-20');
    expect(container.querySelector('.bg-red-500')).toHaveStyle({
      width: '20%',
    });
  });

  it('clamps WinRateBar width between 0% and 100%', () => {
    const { container, rerender } = render(<WinRateBar winPct={65} />);
    expect(container.querySelector('.bg-emerald-500')).toHaveStyle({
      width: '65%',
    });

    rerender(<WinRateBar winPct={125} />);
    expect(container.querySelector('.bg-emerald-500')).toHaveStyle({
      width: '100%',
    });
  });
});
