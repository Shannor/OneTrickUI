import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HighVolumeSummaryBar, WindowPresetPills } from './window-preset-pills';

describe('WindowPresetPills and HighVolumeSummaryBar', () => {
  it('returns null when fewer than 11 matches in standard mode', () => {
    const { container } = render(
      <WindowPresetPills
        totalMatches={8}
        isHighVolume={false}
        windowPreset="all"
        onSelectPreset={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders Last 10g, Last 25g, and All Matches for 30 matches and notifies on click', () => {
    const onSelectPreset = vi.fn();
    render(
      <WindowPresetPills
        totalMatches={30}
        isHighVolume={false}
        windowPreset="all"
        onSelectPreset={onSelectPreset}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Last 10g' }));
    expect(onSelectPreset).toHaveBeenCalledWith('10');
    expect(screen.getByRole('button', { name: 'All Matches' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders HighVolumeSummaryBar with match count and Summary Only preset', () => {
    const onSelectPreset = vi.fn();
    render(
      <HighVolumeSummaryBar
        totalMatches={120}
        windowPreset="summary"
        onSelectPreset={onSelectPreset}
      />,
    );

    expect(screen.getByText('120')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Last 25g' }));
    expect(onSelectPreset).toHaveBeenCalledWith('25');
  });
});
