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
  });
});
