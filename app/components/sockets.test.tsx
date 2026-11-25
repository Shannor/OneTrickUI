import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Socket } from '~/api';
import { TooltipProvider } from '~/components/ui/tooltip';

import { Sockets } from './sockets';

const mockSockets: Socket[] = [
  {
    plugHash: 1001,
    name: 'Opening Shot',
    description: 'Improved accuracy and range on the opening shot of attack.',
    icon: '/opening-shot.png',
    isEnabled: true,
    isVisible: true,
    itemTypeDisplayName: 'Trait',
  } as unknown as Socket,
];

describe('Sockets', () => {
  it('opens perk description tooltip on tap and stops parent click propagation', () => {
    const onParentClick = vi.fn();

    render(
      <TooltipProvider>
        <div onClick={onParentClick}>
          <Sockets sockets={mockSockets} displayMode="iconOnly" />
        </div>
      </TooltipProvider>,
    );

    const trigger = screen.getByRole('button');
    expect(trigger).toHaveClass('min-h-11', 'min-w-11');

    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);

    expect(onParentClick).not.toHaveBeenCalled();
    expect(screen.getAllByText('Opening Shot').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        'Improved accuracy and range on the opening shot of attack.',
      ).length,
    ).toBeGreaterThan(0);
  });
});
