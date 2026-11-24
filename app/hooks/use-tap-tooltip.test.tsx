import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';

import { useTapTooltip } from './use-tap-tooltip';

function TestTapTooltip({
  onOuterClick,
}: {
  onOuterClick?: () => void;
}) {
  const { open, onOpenChange, triggerProps, contentProps } = useTapTooltip();

  return (
    <TooltipProvider>
      <div data-testid="outer-card" onClick={onOuterClick}>
        <Tooltip open={open} onOpenChange={onOpenChange}>
          <TooltipTrigger asChild>
            <button type="button" {...triggerProps}>
              Trigger
            </button>
          </TooltipTrigger>
          <TooltipContent {...contentProps}>
            <span>Tooltip Details</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

describe('useTapTooltip', () => {
  it('opens on pointerDown + click and closes cleanly on a second pointerDown + click', () => {
    render(<TestTapTooltip />);
    const trigger = screen.getByRole('button', { name: 'Trigger' });

    expect(screen.queryByText('Tooltip Details')).not.toBeInTheDocument();

    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);
    expect(screen.getAllByText('Tooltip Details').length).toBeGreaterThan(0);

    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);
    expect(screen.queryByText('Tooltip Details')).not.toBeInTheDocument();
  });

  it('stops click propagation on both trigger and tooltip content', () => {
    const handleOuterClick = vi.fn();
    render(<TestTapTooltip onOuterClick={handleOuterClick} />);
    const trigger = screen.getByRole('button', { name: 'Trigger' });

    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);
    expect(handleOuterClick).not.toHaveBeenCalled();

    const tooltipContent = screen.getAllByText('Tooltip Details')[0];
    fireEvent.click(tooltipContent);
    expect(handleOuterClick).not.toHaveBeenCalled();
  });

  it('clears stale pointerDown state on pointerCancel or keyboard activation', () => {
    render(<TestTapTooltip />);
    const trigger = screen.getByRole('button', { name: 'Trigger' });

    fireEvent.pointerDown(trigger);
    fireEvent.pointerCancel(trigger);

    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.click(trigger);
    expect(screen.getAllByText('Tooltip Details').length).toBeGreaterThan(0);

    fireEvent.keyDown(trigger, { key: ' ' });
    fireEvent.click(trigger);
    expect(screen.queryByText('Tooltip Details')).not.toBeInTheDocument();
  });
});
