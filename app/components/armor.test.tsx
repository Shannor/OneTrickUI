import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TooltipProvider } from '~/components/ui/tooltip';

import { Armor, type ArmorProps } from './armor';

const baseArmorProps = {
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
    stats: {
      1: { hash: 1, name: 'Health', value: 22 },
    },
    perks: [],
    sockets: [
      {
        plugHash: 10,
        name: 'Unflinching Kinetic Aim',
        description: 'Reduces flinching from incoming fire.',
        icon: '/mod.png',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: 'Chest Armor Mod',
      },
    ],
  },
} as unknown as ArmorProps;

describe('Armor', () => {
  it('renders the transmog icon from styleBasicInfo while keeping the armor name', () => {
    render(
      <TooltipProvider>
        <Armor {...baseArmorProps} />
      </TooltipProvider>,
    );

    const img = screen.getByAltText('Cyberserpent Null Vest');
    expect(img).toHaveAttribute(
      'src',
      'https://www.bungie.net/iron-companion-vest.jpg',
    );
    expect(screen.getByText('Cyberserpent Null Vest')).toBeInTheDocument();
  });

  it('opens and closes armor stats tooltip on tap, and isolates nested mod socket taps', () => {
    render(
      <TooltipProvider>
        <Armor {...baseArmorProps} />
      </TooltipProvider>,
    );

    const buttons = screen.getAllByRole('button');
    const armorTrigger = buttons[0];
    const modSocketTrigger = buttons[1];

    expect(screen.queryByText('Health')).not.toBeInTheDocument();

    fireEvent.pointerDown(armorTrigger);
    fireEvent.click(armorTrigger);
    expect(screen.getAllByText('Health').length).toBeGreaterThan(0);

    fireEvent.pointerDown(armorTrigger);
    fireEvent.click(armorTrigger);
    expect(screen.queryByText('Health')).not.toBeInTheDocument();

    fireEvent.pointerDown(modSocketTrigger);
    fireEvent.click(modSocketTrigger);
    expect(
      screen.getAllByText('Unflinching Kinetic Aim').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText('Health')).not.toBeInTheDocument();
  });
});
