import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ArmorSetBonus } from '~/api';
import { TooltipProvider } from '~/components/ui/tooltip';

import {
  ArmorSetBonusPill,
  ArmorSetBonusesPanel,
  formatArmorSetBonusLabel,
  formatArmorSetBonusSummary,
  getHighestActiveTier,
} from './armor-set-bonuses';

const singleFourPieceBonus: ArmorSetBonus = {
  setHash: 742845781n,
  setName: 'Cruel Electrum',
  activeCount: 4,
  activePerks: [
    {
      requiredSetCount: 2,
      hash: 2562518502n,
      name: 'Primary Survivor',
      description: 'Primary ammo weapons gain handling when allies fall.',
      iconPath: '/common/destiny2_content/icons/primary-survivor.png',
    },
    {
      requiredSetCount: 4,
      hash: 2562518503n,
      name: 'Primary Phantom',
      description: 'Final blows with Primary weapons remove you from radar.',
      iconPath:
        'https://www.bungie.net/common/destiny2_content/icons/primary-phantom.png',
    },
  ],
};

const threePieceTwoTierBonus: ArmorSetBonus = {
  setHash: 2618364783n,
  setName: 'Per Audacia',
  activeCount: 3,
  activePerks: [
    {
      requiredSetCount: 2,
      hash: 3091068916n,
      name: 'Primary Chain',
      description: 'Primary final blows grant stacking mobility and range.',
      iconPath: '/common/destiny2_content/icons/primary-chain.png',
    },
  ],
};

describe('armor-set-bonuses helpers', () => {
  it('computes highest active tier from unlocked activePerks rather than raw piece count', () => {
    expect(getHighestActiveTier(singleFourPieceBonus)).toBe(4);
    expect(getHighestActiveTier(threePieceTwoTierBonus)).toBe(2);
    expect(formatArmorSetBonusLabel(singleFourPieceBonus)).toBe(
      'Cruel Electrum (4pc)',
    );
    expect(formatArmorSetBonusLabel(threePieceTwoTierBonus)).toBe(
      'Per Audacia (2pc)',
    );
  });

  it('formats multi-set and empty summaries cleanly', () => {
    expect(formatArmorSetBonusSummary([])).toBe('None');
    expect(formatArmorSetBonusSummary(undefined)).toBe('None');
    expect(
      formatArmorSetBonusSummary([
        singleFourPieceBonus,
        threePieceTwoTierBonus,
      ]),
    ).toBe('Cruel Electrum (4pc) + Per Audacia (2pc)');
  });
});

describe('ArmorSetBonusesPanel', () => {
  it('renders nothing when bonuses are empty or undefined', () => {
    const { container: emptyContainer } = render(
      <ArmorSetBonusesPanel bonuses={[]} />,
    );
    expect(emptyContainer).toBeEmptyDOMElement();

    const { container: undefContainer } = render(
      <ArmorSetBonusesPanel bonuses={undefined} />,
    );
    expect(undefContainer).toBeEmptyDOMElement();
  });

  it('renders single-set 4-piece bonuses with perk icons, tier badges, and descriptions', () => {
    render(<ArmorSetBonusesPanel bonuses={[singleFourPieceBonus]} />);

    expect(screen.getByTestId('active-set-bonuses')).toBeInTheDocument();
    expect(screen.getByText('Active Set Bonuses')).toBeInTheDocument();
    expect(screen.getByText('Cruel Electrum')).toBeInTheDocument();
    expect(screen.getByText('4-Piece Set')).toBeInTheDocument();
    expect(screen.getByText('Primary Survivor')).toBeInTheDocument();
    expect(screen.getByText('2-Piece')).toBeInTheDocument();
    expect(
      screen.getByText('Primary ammo weapons gain handling when allies fall.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Primary Phantom')).toBeInTheDocument();
    expect(screen.getByText('4-Piece')).toBeInTheDocument();
    expect(screen.getByAltText('Primary Survivor')).toHaveAttribute(
      'src',
      'https://www.bungie.net/common/destiny2_content/icons/primary-survivor.png',
    );
    expect(screen.getByAltText('Primary Phantom')).toHaveAttribute(
      'src',
      'https://www.bungie.net/common/destiny2_content/icons/primary-phantom.png',
    );
  });

  it('renders split 2+2 set bonuses with active set count badge', () => {
    render(
      <ArmorSetBonusesPanel
        bonuses={[
          { ...singleFourPieceBonus, activeCount: 2, activePerks: [singleFourPieceBonus.activePerks[0]] },
          threePieceTwoTierBonus,
        ]}
      />,
    );

    expect(screen.getByText('2 Active Sets')).toBeInTheDocument();
    expect(screen.getByText('Cruel Electrum')).toBeInTheDocument();
    expect(screen.getByText('Per Audacia')).toBeInTheDocument();
    expect(screen.getAllByText('2-Piece Set')).toHaveLength(2);
  });
  it('uses two columns for 2 active perks and falls back to single column for 3+ perks', () => {
    const { rerender } = render(
      <ArmorSetBonusesPanel bonuses={[singleFourPieceBonus]} />,
    );
    const twoPerkGrid = screen
      .getByTestId('armor-set-bonus-742845781')
      .querySelector('.grid');
    expect(twoPerkGrid).toHaveClass('md:grid-cols-2');

    const threeTierBonus: ArmorSetBonus = {
      ...singleFourPieceBonus,
      activeCount: 5,
      activePerks: [
        ...singleFourPieceBonus.activePerks,
        {
          requiredSetCount: 5,
          hash: 2562518504n,
          name: 'Primary Apex',
          description: 'Bonus fifth-piece effect.',
          iconPath: '/common/destiny2_content/icons/primary-apex.png',
        },
      ],
    };

    rerender(<ArmorSetBonusesPanel bonuses={[threeTierBonus]} />);
    const threePerkGrid = screen
      .getByTestId('armor-set-bonus-742845781')
      .querySelector('.grid');
    expect(threePerkGrid).not.toHaveClass('md:grid-cols-2');
    expect(screen.getByText('Primary Apex')).toBeInTheDocument();
  });
});

describe('ArmorSetBonusPill', () => {
  it('renders a semantic button pill and toggles tooltip open and closed across pointerDown + click', () => {
    render(
      <TooltipProvider>
        <ArmorSetBonusPill bonus={singleFourPieceBonus} />
      </TooltipProvider>,
    );

    const pill = screen.getByTestId('armor-set-bonus-pill-742845781');
    expect(pill.tagName).toBe('BUTTON');
    expect(pill).toHaveAttribute('type', 'button');
    expect(pill).toHaveTextContent('Cruel Electrum');
    expect(pill).toHaveTextContent('(4pc)');

    fireEvent.pointerDown(pill);
    fireEvent.click(pill);

    expect(screen.getAllByText('Primary Survivor').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Primary Phantom').length).toBeGreaterThan(0);

    fireEvent.pointerDown(pill);
    fireEvent.click(pill);

    expect(screen.queryByText('Primary Survivor')).not.toBeInTheDocument();
    expect(screen.queryByText('Primary Phantom')).not.toBeInTheDocument();
  });
});
