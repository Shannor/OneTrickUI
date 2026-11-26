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
  });
});
