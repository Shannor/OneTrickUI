import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TooltipProvider } from '~/components/ui/tooltip';
import { Armor, type ArmorProps } from './armor';

describe('Armor', () => {
  it('renders the transmog icon from styleBasicInfo while keeping the armor name', () => {
    const props = {
      instanceId: 'inst-1',
      name: 'Cyberserpent Null Vest',
      itemHash: 1n,
      details: {
        baseInfo: {
          name: 'Cyberserpent Null Vest',
          icon: '/base-vest.jpg',
          itemTypeDisplayName: 'Chest Armor',
          tierTypeName: 'Legendary',
          styleBasicInfo: {
            name: 'Iron Companion Vest',
            icon: '/iron-companion-vest.jpg',
          },
        },
        stats: {},
        perks: [],
        sockets: [
          {
            plugHash: 10,
            name: 'Unflinching Kinetic Aim',
            description: '',
            icon: '/mod.png',
            isEnabled: true,
            isVisible: true,
            itemTypeDisplayName: 'Chest Armor Mod',
          },
        ],
      },
    } as unknown as ArmorProps;

    render(
      <TooltipProvider>
        <Armor {...props} />
      </TooltipProvider>,
    );

    const img = screen.getByAltText('Cyberserpent Null Vest');
    expect(img).toHaveAttribute(
      'src',
      'https://www.bungie.net/iron-companion-vest.jpg',
    );
    expect(screen.getByText('Cyberserpent Null Vest')).toBeInTheDocument();
  });
});
