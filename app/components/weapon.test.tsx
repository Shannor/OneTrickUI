import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '~/components/ui/tooltip';

import { Weapon } from './weapon';

const weaponProperties = {
  baseInfo: {
    name: 'Ace of Spades',
    icon: '/ace.jpg',
    tierTypeName: 'Exotic',
    itemTypeDisplayName: 'Hand Cannon',
  },
  perks: [],
  stats: {},
  sockets: [
    {
      plugHash: 1,
      name: 'Memento Mori',
      description: 'Reloading after a kill loads extra-damage bullets.',
      icon: '/perk.png',
      isVisible: true,
      isEnabled: true,
      itemTypeDisplayName: 'Intrinsic',
    },
  ],
} as any;

describe('Weapon (compact)', () => {
  it('renders a single accessible button header with aria-expanded and stops propagation when expandableSockets is true', () => {
    const onParentClick = vi.fn();

    render(
      <TooltipProvider>
        <div onClick={onParentClick}>
          <Weapon compact expandableSockets properties={weaponProperties} />
        </div>
      </TooltipProvider>,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);

    const toggleButton = buttons[0];
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggleButton);
    expect(onParentClick).not.toHaveBeenCalled();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders a non-interactive header container when expandableSockets is false', () => {
    render(
      <TooltipProvider>
        <Weapon
          compact
          expandableSockets={false}
          properties={weaponProperties}
        />
      </TooltipProvider>,
    );

    expect(
      screen.queryByRole('button', { name: /ace of spades/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Ace of Spades')).toBeInTheDocument();
    expect(screen.getByTestId('weapon-avatar')).not.toHaveClass(
      'border-yellow-500',
    );
  });

  it('applies a yellow border to the weapon avatar in compact mode when enhanced', () => {
    const enhancedCompactWeapon = {
      baseInfo: {
        name: 'Rose',
        icon: '/rose.jpg',
        tierTypeName: 'Legendary',
        itemTypeDisplayName: 'Hand Cannon',
      },
      perks: [],
      stats: {},
      sockets: [
        {
          plugHash: 2728416797,
          name: 'Enhancement 2',
          description: '',
          icon: '',
          isVisible: false,
          isEnabled: true,
          itemTypeDisplayName: '',
        },
        {
          plugHash: 201,
          name: 'Slideshot',
          description: 'Enhanced slideshot.',
          icon: '/slideshot.png',
          isVisible: true,
          isEnabled: true,
          itemTypeDisplayName: 'Enhanced Trait',
        },
      ],
    } as any;

    render(
      <TooltipProvider>
        <Weapon compact properties={enhancedCompactWeapon} />
      </TooltipProvider>,
    );

    expect(screen.getByText('Rose')).toBeInTheDocument();
    expect(screen.getByTestId('weapon-avatar')).toHaveClass(
      'border-2',
      'border-yellow-500',
    );
    expect(screen.queryByText('Enhanced')).not.toBeInTheDocument();
  });
});

describe('Weapon (full)', () => {
  it('applies a yellow border to enhanced weapon icons and enhanced sockets without badges', () => {
    const enhancedFullWeapon = {
      baseInfo: {
        name: "Elsie's Rifle",
        icon: '/elsies.jpg',
        tierTypeName: 'Legendary',
        itemTypeDisplayName: 'Pulse Rifle',
      },
      perks: [],
      stats: {},
      sockets: [
        {
          plugHash: 101,
          name: 'High-Impact Frame',
          description: 'Slow-firing and high-damage.',
          icon: '/frame.png',
          isVisible: true,
          isEnabled: true,
          itemTypeDisplayName: 'Enhanced Intrinsic',
        },
        {
          plugHash: 102,
          name: 'Zen Moment',
          description: 'Causing damage reduces recoil and flinch.',
          icon: '/zen.png',
          isVisible: true,
          isEnabled: true,
          itemTypeDisplayName: 'Enhanced Trait',
        },
        {
          plugHash: 103,
          name: 'Arrowhead Brake',
          description: 'Greatly controls recoil.',
          icon: '/barrel.png',
          isVisible: true,
          isEnabled: true,
          itemTypeDisplayName: 'Barrel',
        },
      ],
    } as any;

    const { container } = render(
      <TooltipProvider>
        <Weapon properties={enhancedFullWeapon} />
      </TooltipProvider>,
    );

    expect(screen.getByText("Elsie's Rifle")).toBeInTheDocument();
    expect(screen.getByTestId('weapon-avatar')).toHaveClass(
      'border-2',
      'border-yellow-500',
    );
    expect(
      container.querySelectorAll('button[data-enhanced="true"]'),
    ).toHaveLength(2);
    expect(screen.queryByText('Enhanced')).not.toBeInTheDocument();
  });

  it('does not apply a yellow border for a non-enhanced weapon without an active catalyst', () => {
    const { container } = render(
      <TooltipProvider>
        <Weapon properties={weaponProperties} />
      </TooltipProvider>,
    );

    expect(screen.getByText('Ace of Spades')).toBeInTheDocument();
    expect(screen.getByTestId('weapon-avatar')).not.toHaveClass(
      'border-yellow-500',
    );
    expect(
      container.querySelectorAll('button[data-enhanced="true"]'),
    ).toHaveLength(0);
    expect(
      container.querySelectorAll('button[data-catalyst="true"]'),
    ).toHaveLength(0);
  });

  it('applies a yellow border and renders the Exotic catalyst socket even when itemTypeDisplayName is empty', () => {
    const exoticWithCatalyst = {
      ...weaponProperties,
      sockets: [
        ...weaponProperties.sockets,
        {
          plugHash: 3947093900,
          name: 'Ace of Spades Catalyst',
          description:
            'Firefly deals more damage while Memento Mori is active.',
          icon: '/ace-catalyst.png',
          isVisible: true,
          isEnabled: true,
          itemTypeDisplayName: '',
        },
      ],
    } as any;

    const { container, unmount } = render(
      <TooltipProvider>
        <Weapon properties={exoticWithCatalyst} />
      </TooltipProvider>,
    );

    expect(screen.getByTestId('weapon-avatar')).toHaveClass(
      'border-2',
      'border-yellow-500',
    );
    expect(
      container.querySelectorAll('button[data-catalyst="true"]'),
    ).toHaveLength(1);
    expect(screen.queryByText('Catalyst')).not.toBeInTheDocument();

    unmount();

    const compactRender = render(
      <TooltipProvider>
        <Weapon compact defaultSocketsOpen properties={exoticWithCatalyst} />
      </TooltipProvider>,
    );

    expect(screen.getByTestId('weapon-avatar')).toHaveClass(
      'border-2',
      'border-yellow-500',
    );
    expect(
      compactRender.container.querySelectorAll('button[data-catalyst="true"]'),
    ).toHaveLength(1);
  });

  it('does not apply a yellow border when an Exotic has an Empty Catalyst Socket', () => {
    const exoticWithEmptyCatalyst = {
      baseInfo: {
        name: 'Truth',
        icon: '/truth.jpg',
        tierType: 6,
        tierTypeName: 'Exotic',
        itemTypeDisplayName: 'Rocket Launcher',
      },
      perks: [],
      stats: {},
      sockets: [
        {
          plugHash: 1498917124,
          name: 'Empty Catalyst Socket',
          description: '',
          icon: '/empty-catalyst.png',
          isVisible: true,
          isEnabled: true,
          itemTypeDisplayName: '',
        },
      ],
    } as any;

    const { container } = render(
      <TooltipProvider>
        <Weapon properties={exoticWithEmptyCatalyst} />
      </TooltipProvider>,
    );

    expect(screen.getByTestId('weapon-avatar')).not.toHaveClass(
      'border-yellow-500',
    );
    expect(
      container.querySelector('[data-catalyst="empty"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll('button[data-catalyst="true"]'),
    ).toHaveLength(0);
    expect(screen.queryByText('No Catalyst')).not.toBeInTheDocument();
  });
});
