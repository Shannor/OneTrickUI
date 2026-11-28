import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  WinLossRecord,
  formatWinLossRecord,
  getWinLossColorClass,
} from './win-loss-record';

describe('getWinLossColorClass', () => {
  it('returns emerald classes for positive records', () => {
    expect(getWinLossColorClass(12, 6)).toBe(
      'text-emerald-600 dark:text-emerald-400',
    );
  });

  it('returns emerald classes for even non-zero records', () => {
    expect(getWinLossColorClass(3, 3)).toBe(
      'text-emerald-600 dark:text-emerald-400',
    );
  });

  it('returns red classes for negative records', () => {
    expect(getWinLossColorClass(2, 3)).toBe('text-red-600 dark:text-red-400');
  });

  it('returns muted class when both wins and losses are zero', () => {
    expect(getWinLossColorClass(0, 0)).toBe('text-muted-foreground');
  });
});

describe('formatWinLossRecord', () => {
  it('formats all supported display styles', () => {
    expect(formatWinLossRecord(12, 6)).toBe('12W-6L');
    expect(formatWinLossRecord(12, 6, 'compact')).toBe('12W-6L');
    expect(formatWinLossRecord(12, 6, 'spaced-parens')).toBe('(12W - 6L)');
    expect(formatWinLossRecord(12, 6, 'en-dash')).toBe('12W–6L');
    expect(formatWinLossRecord(12, 6, 'numeric-parens')).toBe('(12-6)');
  });
});

describe('WinLossRecord', () => {
  it('renders positive record with emerald classes', () => {
    render(<WinLossRecord wins={12} losses={6} />);
    const el = screen.getByText('12W-6L');
    expect(el).toHaveClass('text-emerald-600', 'dark:text-emerald-400');
  });

  it('renders negative record with red classes', () => {
    render(<WinLossRecord wins={2} losses={3} format="spaced-parens" />);
    const el = screen.getByText('(2W - 3L)');
    expect(el).toHaveClass('text-red-600', 'dark:text-red-400');
  });

  it('renders 0-0 record with muted styling and merges custom className', () => {
    render(
      <WinLossRecord
        wins={0}
        losses={0}
        format="en-dash"
        className="text-xs"
      />,
    );
    const el = screen.getByText('0W–0L');
    expect(el).toHaveClass('text-muted-foreground', 'text-xs');
  });
});
