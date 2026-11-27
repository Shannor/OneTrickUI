import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TooltipProvider } from '~/components/ui/tooltip';

import { WeaponHeader } from './weapon-header';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;
}

describe('WeaponHeader', () => {
  it('applies a yellow border to enhanced weapon icons without badges', () => {
    const properties = {
      baseInfo: {
        name: 'Rose',
        icon: '/rose.jpg',
      },
      perks: [],
      stats: {},
      sockets: [
        {
          plugHash: 2728416796,
          name: 'Enhancement 3',
          description: '',
          icon: '',
          isEnabled: true,
          isVisible: false,
          itemTypeDisplayName: '',
        },
      ],
    } as any;

    render(
      <TooltipProvider>
        <WeaponHeader properties={properties} onlyIcon />
      </TooltipProvider>,
    );

    const image = screen.getByAltText('Rose image');
    expect(image).toHaveClass('border-2', 'border-yellow-500');

    const trigger = screen.getByRole('button');
    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);

    expect(screen.getAllByText('Rose').length).toBeGreaterThan(0);
    expect(screen.queryByText('Enhanced')).not.toBeInTheDocument();
  });

  it('omits yellow border for non-enhanced weapons without active catalysts', () => {
    const properties = {
      baseInfo: {
        name: 'Ace of Spades',
        icon: '/ace.jpg',
      },
      perks: [],
      stats: {},
      sockets: [],
    } as any;

    render(
      <TooltipProvider>
        <WeaponHeader properties={properties} />
      </TooltipProvider>,
    );

    expect(screen.getByText('Ace of Spades')).toBeInTheDocument();
    expect(screen.getByAltText('Ace of Spades image')).not.toHaveClass(
      'border-yellow-500',
    );
  });

  it('applies a yellow border for Exotic weapons with an active catalyst', () => {
    const properties = {
      baseInfo: {
        name: 'Ace of Spades',
        icon: '/ace.jpg',
        tierType: 6,
        tierTypeName: 'Exotic',
      },
      perks: [],
      stats: {},
      sockets: [
        {
          plugHash: 3947093900,
          name: 'Ace of Spades Catalyst',
          description: '',
          icon: '',
          isEnabled: true,
          isVisible: true,
          itemTypeDisplayName: '',
        },
      ],
    } as any;

    render(
      <TooltipProvider>
        <WeaponHeader properties={properties} onlyIcon />
      </TooltipProvider>,
    );

    expect(screen.getByAltText('Ace of Spades image')).toHaveClass(
      'border-2',
      'border-yellow-500',
    );
    expect(screen.queryByText('Catalyst')).not.toBeInTheDocument();
  });

  it('omits yellow border when Exotic catalyst socket is empty', () => {
    const properties = {
      baseInfo: {
        name: 'Truth',
        icon: '/truth.jpg',
        tierType: 6,
        tierTypeName: 'Exotic',
      },
      perks: [],
      stats: {},
      sockets: [
        {
          plugHash: 1498917124,
          name: 'Empty Catalyst Socket',
          description: '',
          icon: '',
          isEnabled: true,
          isVisible: true,
          itemTypeDisplayName: '',
        },
      ],
    } as any;

    render(
      <TooltipProvider>
        <WeaponHeader properties={properties} />
      </TooltipProvider>,
    );

    expect(screen.getByText('Truth')).toBeInTheDocument();
    expect(screen.getByAltText('Truth image')).not.toHaveClass(
      'border-yellow-500',
    );
    expect(screen.queryByText('No Catalyst')).not.toBeInTheDocument();
  });
});
