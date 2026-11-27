import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ItemSnapshot } from '~/api';
import { TooltipProvider } from '~/components/ui/tooltip';

import { GearItemPill } from './gear-item-pill';

const mockWeapon = {
  itemHash: 1498876634n,
  name: 'Rose',
  details: {
    baseInfo: {
      name: 'Rose',
      icon: '/rose.png',
      tierTypeName: 'Legendary',
      itemTypeDisplayName: 'Hand Cannon',
      itemTypeAndTierDisplayName: 'Legendary Hand Cannon',
    },
    perks: [
      {
        hash: 101n,
        name: 'Slideshot',
        description: 'Sliding partially reloads this weapon.',
        iconPath: '/slideshot.png',
      },
    ],
    stats: {
      1240592695: {
        hash: 1240592695,
        name: 'Range',
        value: 68,
      },
    },
  },
} as unknown as ItemSnapshot;

describe('GearItemPill', () => {
  it('opens tooltip details on tap without triggering parent card click', () => {
    const onCardClick = vi.fn();

    render(
      <TooltipProvider>
        <div onClick={onCardClick}>
          <GearItemPill item={mockWeapon} tooltipHeading="Primary Kinetic" />
        </div>
      </TooltipProvider>,
    );

    const pillButton = screen.getByRole('button', { name: /rose/i });
    fireEvent.pointerDown(pillButton);
    fireEvent.click(pillButton);

    expect(onCardClick).not.toHaveBeenCalled();
    expect(screen.getAllByText('Primary Kinetic').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Slideshot').length).toBeGreaterThan(0);

    fireEvent.pointerDown(pillButton);
    fireEvent.click(pillButton);

    expect(onCardClick).not.toHaveBeenCalled();
    expect(screen.queryByText('Primary Kinetic')).not.toBeInTheDocument();
    expect(screen.getByAltText('Rose')).not.toHaveClass('border-yellow-500');
  });

  it('applies a yellow border on the pill icon for enhanced weapons without badges', () => {
    const enhancedWeapon = {
      ...mockWeapon,
      details: {
        ...mockWeapon.details,
        sockets: [
          {
            plugHash: 2001,
            name: 'Slideshot',
            description: '',
            icon: '',
            isEnabled: true,
            isVisible: true,
            itemTypeDisplayName: 'Enhanced Trait',
            itemTypeTieredDisplayName: 'Common Enhanced Trait',
          },
        ],
      },
    } as unknown as ItemSnapshot;

    render(
      <TooltipProvider>
        <GearItemPill item={enhancedWeapon} tooltipHeading="Primary Kinetic" />
      </TooltipProvider>,
    );

    const pillButton = screen.getByRole('button', { name: /rose/i });
    expect(pillButton).toHaveAttribute('data-enhanced', 'true');
    expect(screen.getByAltText('Rose')).toHaveClass(
      'border-2',
      'border-yellow-500',
    );
    expect(screen.queryByText('Enhanced')).not.toBeInTheDocument();
  });

  it('applies a yellow border when label prop is provided on enhanced weapons', () => {
    const enhancedWeapon = {
      ...mockWeapon,
      details: {
        ...mockWeapon.details,
        sockets: [
          {
            plugHash: 2728416798,
            name: 'Enhancement 1',
            description: '',
            icon: '',
            isEnabled: true,
            isVisible: false,
            itemTypeDisplayName: '',
            itemTypeTieredDisplayName: '',
          },
        ],
      },
    } as unknown as ItemSnapshot;

    render(
      <TooltipProvider>
        <GearItemPill label="Kinetic" item={enhancedWeapon} />
      </TooltipProvider>,
    );

    expect(screen.getByText('Kinetic')).toBeInTheDocument();
    expect(screen.getByText('Rose')).toBeInTheDocument();
    expect(screen.getByAltText('Rose')).toHaveClass(
      'border-2',
      'border-yellow-500',
    );
    expect(screen.queryByText('Enhanced')).not.toBeInTheDocument();
  });

  it('applies a yellow border for Exotic weapons with an active catalyst', () => {
    const exoticWithCatalyst = {
      ...mockWeapon,
      name: 'Ace of Spades',
      details: {
        ...mockWeapon.details,
        baseInfo: {
          ...mockWeapon.details.baseInfo,
          name: 'Ace of Spades',
          tierType: 6,
          tierTypeName: 'Exotic',
        },
        sockets: [
          {
            plugHash: 3947093900,
            name: 'Ace of Spades Catalyst',
            description: '',
            icon: '',
            isEnabled: true,
            isVisible: true,
            itemTypeDisplayName: '',
            itemTypeTieredDisplayName: '',
          },
        ],
      },
    } as unknown as ItemSnapshot;

    render(
      <TooltipProvider>
        <GearItemPill label="Kinetic" item={exoticWithCatalyst} />
      </TooltipProvider>,
    );

    const pillButton = screen.getByRole('button', { name: /ace of spades/i });
    expect(pillButton).toHaveAttribute('data-catalyst', 'active');
    expect(screen.getByAltText('Ace of Spades')).toHaveClass(
      'border-2',
      'border-yellow-500',
    );
    expect(screen.queryByText('Catalyst')).not.toBeInTheDocument();
  });

  it('omits yellow border for Exotic weapons with an Empty Catalyst Socket', () => {
    const exoticWithoutCatalyst = {
      ...mockWeapon,
      name: 'Truth',
      details: {
        ...mockWeapon.details,
        baseInfo: {
          ...mockWeapon.details.baseInfo,
          name: 'Truth',
          tierType: 6,
          tierTypeName: 'Exotic',
        },
        sockets: [
          {
            plugHash: 1498917124,
            name: 'Empty Catalyst Socket',
            description: '',
            icon: '',
            isEnabled: true,
            isVisible: true,
            itemTypeDisplayName: '',
            itemTypeTieredDisplayName: '',
          },
        ],
      },
    } as unknown as ItemSnapshot;

    render(
      <TooltipProvider>
        <GearItemPill item={exoticWithoutCatalyst} />
      </TooltipProvider>,
    );

    const pillButton = screen.getByRole('button', { name: /truth/i });
    expect(pillButton).toHaveAttribute('data-catalyst', 'empty');
    expect(screen.getByAltText('Truth')).not.toHaveClass('border-yellow-500');
    expect(screen.queryByText('No Catalyst')).not.toBeInTheDocument();
  });
});
