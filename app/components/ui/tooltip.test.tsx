import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

describe('Tooltip mobile tap behavior', () => {
  it('opens on first tap, stops parent click propagation, and closes on second tap', () => {
    const onParentClick = vi.fn();

    render(
      <TooltipProvider>
        <div onClick={onParentClick}>
          <Tooltip>
            <TooltipTrigger>Inspect Perk</TooltipTrigger>
            <TooltipContent>Precision hits grant stability.</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>,
    );

    const trigger = screen.getByRole('button', { name: 'Inspect Perk' });
    expect(
      screen.queryByText('Precision hits grant stability.'),
    ).not.toBeInTheDocument();

    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);

    expect(onParentClick).not.toHaveBeenCalled();
    const tooltipContents = screen.getAllByText(
      'Precision hits grant stability.',
    );
    expect(tooltipContents.length).toBeGreaterThan(0);

    fireEvent.click(tooltipContents[0]);
    expect(onParentClick).not.toHaveBeenCalled();

    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);

    expect(onParentClick).not.toHaveBeenCalled();
    expect(
      screen.queryByText('Precision hits grant stability.'),
    ).not.toBeInTheDocument();
  });

  it('passes clicks through without intercepting when disableTapTrigger is set', () => {
    const onActionClick = vi.fn();

    render(
      <TooltipProvider>
        <Tooltip disableTapTrigger>
          <TooltipTrigger asChild>
            <button type="button" onClick={onActionClick}>
              Share Loadout
            </button>
          </TooltipTrigger>
          <TooltipContent>Share loadout link</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const button = screen.getByRole('button', { name: 'Share Loadout' });
    fireEvent.pointerDown(button);
    fireEvent.click(button);

    expect(onActionClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Share loadout link')).not.toBeInTheDocument();
  });

  it('preserves mobile viewport max-width clamp when a desktop max-w class is passed', () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>Set Bonus</TooltipTrigger>
          <TooltipContent data-testid="set-bonus-tooltip" className="max-w-sm">
            Per Audacia Set Bonus Details
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const content = screen.getByTestId('set-bonus-tooltip');
    expect(content).toHaveClass('max-sm:max-w-[calc(100vw-2rem)]');
  });

  it('closes an already open sibling tooltip when another trigger receives a synthetic click without pointerdown', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>First Perk</TooltipTrigger>
          <TooltipContent>First perk details</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>Second Perk</TooltipTrigger>
          <TooltipContent>Second perk details</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const firstTrigger = screen.getByRole('button', { name: 'First Perk' });
    const secondTrigger = screen.getByRole('button', { name: 'Second Perk' });

    fireEvent.click(firstTrigger);
    expect(screen.getAllByText('First perk details').length).toBeGreaterThan(0);
    expect(screen.queryByText('Second perk details')).not.toBeInTheDocument();

    fireEvent.click(secondTrigger);
    expect(screen.queryByText('First perk details')).not.toBeInTheDocument();
    expect(screen.getAllByText('Second perk details').length).toBeGreaterThan(
      0,
    );
  });
});
