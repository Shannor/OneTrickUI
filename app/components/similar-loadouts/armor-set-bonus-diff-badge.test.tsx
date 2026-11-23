import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ArmorSetBonus } from '~/api';
import { TooltipProvider } from '~/components/ui/tooltip';

import {
  ArmorSetBonusDiffBadge,
  getArmorSetBonusDiffHeading,
} from './armor-set-bonus-diff-badge';

const electrumFourPc: ArmorSetBonus = {
  setHash: 742845781n,
  setName: 'Cruel Electrum',
  activeCount: 4,
  activePerks: [
    {
      requiredSetCount: 2,
      hash: 2562518502n,
      name: 'Primary Survivor',
      description: 'Boosts Primary weapons when allies fall.',
      iconPath: '/icons/survivor.png',
    },
    {
      requiredSetCount: 4,
      hash: 2562518503n,
      name: 'Primary Phantom',
      description: 'Primary final blows hide you from radar.',
      iconPath: '/icons/phantom.png',
    },
  ],
};

const audaciaTwoPc: ArmorSetBonus = {
  setHash: 2618364783n,
  setName: 'Per Audacia',
  activeCount: 2,
  activePerks: [
    {
      requiredSetCount: 2,
      hash: 3091068916n,
      name: 'Primary Chain',
      description: 'Primary kills grant stacking mobility and range.',
      iconPath: '/icons/chain.png',
    },
  ],
};

describe('getArmorSetBonusDiffHeading', () => {
  it('returns the neither-has-bonuses heading when both arrays are empty', () => {
    expect(
      getArmorSetBonusDiffHeading({
        armorSetBonusMatch: true,
        candidateBonuses: [],
        targetBonuses: [],
      }),
    ).toBe('Neither loadout has active Armor Set Bonuses');
  });

  it('returns the matching heading with summary when bonuses match', () => {
    expect(
      getArmorSetBonusDiffHeading({
        armorSetBonusMatch: true,
        candidateBonuses: [electrumFourPc],
        targetBonuses: [electrumFourPc],
      }),
    ).toBe('Same Armor Set Bonuses as Primary (Cruel Electrum (4pc))');
  });

  it('returns the candidate-missing heading when only primary has bonuses', () => {
    expect(
      getArmorSetBonusDiffHeading({
        armorSetBonusMatch: false,
        candidateBonuses: [],
        targetBonuses: [electrumFourPc],
      }),
    ).toBe('No active Armor Set Bonuses (Primary has Cruel Electrum (4pc))');
  });

  it('returns the primary-missing heading when only candidate has bonuses', () => {
    expect(
      getArmorSetBonusDiffHeading({
        armorSetBonusMatch: false,
        candidateBonuses: [audaciaTwoPc],
        targetBonuses: [],
      }),
    ).toBe('Active Armor Set Bonuses (Primary has none)');
  });

  it('returns the differing heading when both loadouts have different bonuses', () => {
    expect(
      getArmorSetBonusDiffHeading({
        armorSetBonusMatch: false,
        candidateBonuses: [audaciaTwoPc],
        targetBonuses: [electrumFourPc],
      }),
    ).toBe('Different Armor Set Bonuses than Primary (Cruel Electrum (4pc))');
  });
});

describe('ArmorSetBonusDiffBadge', () => {
  it('renders No Set Bonuses button and toggles tooltip open and closed on tap', () => {
    render(
      <TooltipProvider>
        <ArmorSetBonusDiffBadge
          armorSetBonusMatch
          candidateBonuses={[]}
          targetBonuses={[]}
        />
      </TooltipProvider>,
    );

    const badge = screen.getByTestId('armor-set-bonus-diff-badge');
    expect(badge.tagName).toBe('BUTTON');
    expect(badge).toHaveAttribute('type', 'button');
    expect(badge).toHaveTextContent('No Set Bonuses');

    fireEvent.pointerDown(badge);
    fireEvent.click(badge);
    expect(
      screen.getAllByText('Neither loadout has active Armor Set Bonuses')
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("This Loadout's Set Bonuses").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Primary Target's Set Bonuses"),
    ).not.toBeInTheDocument();

    fireEvent.pointerDown(badge);
    fireEvent.click(badge);
    expect(
      screen.queryByText('Neither loadout has active Armor Set Bonuses'),
    ).not.toBeInTheDocument();
  });

  it('renders Set Bonus Match without primary comparison section when sets match', () => {
    render(
      <TooltipProvider>
        <ArmorSetBonusDiffBadge
          armorSetBonusMatch
          candidateBonuses={[electrumFourPc]}
          targetBonuses={[electrumFourPc]}
        />
      </TooltipProvider>,
    );

    const badge = screen.getByTestId('armor-set-bonus-diff-badge');
    expect(badge).toHaveTextContent('Set Bonus Match');

    fireEvent.pointerDown(badge);
    fireEvent.click(badge);
    expect(
      screen.getAllByText(
        'Same Armor Set Bonuses as Primary (Cruel Electrum (4pc))',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("This Loadout's Set Bonuses").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Primary Target's Set Bonuses"),
    ).not.toBeInTheDocument();
  });

  it('renders Set diff badge and both candidate and primary tooltip sections when sets differ', () => {
    render(
      <TooltipProvider>
        <ArmorSetBonusDiffBadge
          armorSetBonusMatch={false}
          candidateBonuses={[audaciaTwoPc]}
          targetBonuses={[electrumFourPc]}
        />
      </TooltipProvider>,
    );

    const badge = screen.getByTestId('armor-set-bonus-diff-badge');
    expect(badge).toHaveTextContent('Set: Per Audacia (2pc)');

    fireEvent.pointerDown(badge);
    fireEvent.click(badge);
    expect(
      screen.getAllByText(
        'Different Armor Set Bonuses than Primary (Cruel Electrum (4pc))',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("This Loadout's Set Bonuses").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Primary Target's Set Bonuses").length,
    ).toBeGreaterThan(0);
  });
});
