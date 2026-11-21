import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DeltaBadge, getDeltaColorClass } from './delta-badge';

describe('getDeltaColorClass', () => {
  it('returns emerald color class for positive delta', () => {
    expect(getDeltaColorClass(10)).toBe('text-emerald-600 dark:text-emerald-400');
  });

  it('returns amber color class for negative delta', () => {
    expect(getDeltaColorClass(-5)).toBe('text-amber-600 dark:text-amber-400');
  });

  it('returns muted foreground class for zero delta', () => {
    expect(getDeltaColorClass(0)).toBe('text-muted-foreground');
  });
});

describe('DeltaBadge', () => {
  it('renders positive delta with emerald styling and upward trend icon', () => {
    const { container } = render(<DeltaBadge delta={225} label="+225 pts" />);

    expect(screen.getByText('+225 pts')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('text-emerald-600');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders negative delta with amber styling and downward trend icon', () => {
    const { container } = render(<DeltaBadge delta={-120} label="-120 pts" />);

    expect(screen.getByText('-120 pts')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('text-amber-600');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders zero delta with muted styling and no trend icon', () => {
    const { container } = render(<DeltaBadge delta={0} label="0 pts" />);

    expect(screen.getByText('0 pts')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('text-muted-foreground');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('hides trend icon when showIcon is false', () => {
    const { container } = render(
      <DeltaBadge delta={225} label="· +225 pts" showIcon={false} />,
    );

    expect(screen.getByText('· +225 pts')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
