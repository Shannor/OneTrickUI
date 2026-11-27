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
    expect(trigger).not.toHaveAttribute('data-enhanced');
    expect(trigger.firstElementChild).not.toHaveClass('border-yellow-500');
  });

  it('highlights enhanced perks with a yellow border only', () => {
    const enhancedSockets: Socket[] = [
      {
        plugHash: 2001,
        name: 'Slideshot',
        description:
          'Sliding partially reloads this weapon magazine and boosts range and stability for an improved duration.',
        icon: '/slideshot.png',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: 'Enhanced Trait',
        itemTypeTieredDisplayName: 'Common Enhanced Trait',
      },
      {
        plugHash: 2002,
        name: 'Precision Frame',
        description: 'Enhanced intrinsic weapon frame.',
        icon: '/intrinsic.png',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: 'Enhanced Intrinsic',
        itemTypeTieredDisplayName: 'Legendary Enhanced Intrinsic',
      },
    ];

    render(
      <TooltipProvider>
        <Sockets sockets={enhancedSockets} displayMode="iconOnly" />
      </TooltipProvider>,
    );

    const triggers = screen.getAllByRole('button');
    expect(triggers).toHaveLength(2);
    expect(triggers[0]).toHaveAttribute('data-enhanced', 'true');
    expect(triggers[1]).toHaveAttribute('data-enhanced', 'true');
    expect(triggers[0].firstElementChild).toHaveClass(
      'border-2',
      'border-yellow-500',
    );
    expect(triggers[1].firstElementChild).toHaveClass(
      'border-2',
      'border-yellow-500',
    );

    fireEvent.pointerDown(triggers[0]);
    fireEvent.click(triggers[0]);

    expect(screen.getAllByText('Slideshot').length).toBeGreaterThan(0);
    expect(screen.queryByText('Enhanced')).not.toBeInTheDocument();
  });

  it('highlights enhanced perks with a yellow border in label mode without badges', () => {
    const enhancedSocket: Socket[] = [
      {
        plugHash: 3001,
        name: 'Keep Away',
        description:
          'Increased reload, range, and accuracy when no enemies are near.',
        icon: '/keep-away.png',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: 'Enhanced Trait',
      },
    ];

    render(
      <TooltipProvider>
        <Sockets sockets={enhancedSocket} displayMode="label" />
      </TooltipProvider>,
    );

    expect(screen.getByText('Keep Away')).toBeInTheDocument();
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute('data-enhanced', 'true');
    expect(trigger.firstElementChild).toHaveClass(
      'border-2',
      'border-yellow-500',
    );
    expect(screen.queryByText('Enhanced')).not.toBeInTheDocument();
  });

  it('highlights Exotic catalyst sockets with a yellow border in iconOnly and label modes', () => {
    const catalystSocket: Socket[] = [
      {
        plugHash: 4001,
        name: 'Ace of Spades Catalyst',
        description: 'Firefly deals more damage while Memento Mori is active.',
        icon: '/ace-catalyst.png',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: '',
      },
    ];

    const { rerender } = render(
      <TooltipProvider>
        <Sockets sockets={catalystSocket} displayMode="iconOnly" isExotic />
      </TooltipProvider>,
    );

    const iconTrigger = screen.getByRole('button');
    expect(iconTrigger).toHaveAttribute('data-catalyst', 'true');
    expect(iconTrigger.firstElementChild).toHaveClass(
      'border-2',
      'border-yellow-500',
    );

    rerender(
      <TooltipProvider>
        <Sockets sockets={catalystSocket} displayMode="label" isExotic />
      </TooltipProvider>,
    );

    expect(screen.getByText('Ace of Spades Catalyst')).toBeInTheDocument();
    expect(screen.getByRole('button').firstElementChild).toHaveClass(
      'border-2',
      'border-yellow-500',
    );
    expect(screen.queryByText('Catalyst')).not.toBeInTheDocument();
  });
});
