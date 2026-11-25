import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CharacterSnapshot } from '~/api';

import { LoadoutCard } from './loadout-card';

const mockSnapshot = {
  id: 'loadout-1',
  name: 'PvP Meta Loadout',
  description: 'Hand Cannon & Shotgun',
  createdAt: new Date('2024-01-01'),
  loadout: {
    3284755031: {
      itemHash: 3284755031n,
      name: 'Solar Hunter',
      details: {
        baseInfo: {
          name: 'Solar Hunter',
          icon: '/solar.png',
          tierTypeName: 'Basic',
          itemTypeDisplayName: 'Subclass',
        },
        sockets: [
          {
            itemTypeDisplayName: 'Super',
            isVisible: true,
            isEnabled: true,
            name: 'Golden Gun',
            icon: '/goldengun.png',
          },
        ],
      },
    },
    1498876634: {
      itemHash: 1498876634n,
      details: {
        baseInfo: {
          name: 'Rose',
          icon: '/rose.png',
          tierTypeName: 'Legendary',
          itemTypeDisplayName: 'Hand Cannon',
        },
      },
    },
    2465295065: {
      itemHash: 2465295065n,
      details: {
        baseInfo: {
          name: 'Matador 64',
          icon: '/matador.png',
          tierTypeName: 'Legendary',
          itemTypeDisplayName: 'Shotgun',
        },
      },
    },
    953998645: {
      itemHash: 953998645n,
      details: {
        baseInfo: {
          name: 'Gjallarhorn',
          icon: '/gjallarhorn.png',
          tierTypeName: 'Exotic',
          itemTypeDisplayName: 'Rocket Launcher',
          styleBasicInfo: {
            name: 'Gjallarfoam',
            icon: '/gjallarfoam.png',
          },
        },
      },
    },
  },
} as unknown as CharacterSnapshot;

const mockStats = {
  kd: { value: 1.85 },
  kda: { value: 2.35 },
  standing: { value: 0.65 },
};

describe('LoadoutCard', () => {
  it('renders loadout title, description, and stats summary correctly', () => {
    const handleClick = vi.fn();
    render(
      <LoadoutCard
        snapshot={mockSnapshot}
        stats={mockStats}
        gamesCount={20}
        onClick={handleClick}
      />,
    );

    expect(screen.getByText('PvP Meta Loadout')).toBeInTheDocument();
    expect(screen.getByText('Hand Cannon & Shotgun')).toBeInTheDocument();
    expect(screen.getByText('Solar Hunter')).toBeInTheDocument();

    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();

    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('Positive')).toBeInTheDocument();

    expect(screen.getByText('K / D')).toBeInTheDocument();
    expect(screen.getByText('1.85')).toBeInTheDocument();

    expect(screen.getByText('Efficiency')).toBeInTheDocument();
    expect(screen.getByText('2.35')).toBeInTheDocument();
  });

  it('renders gear items with weapon names and exotic status', () => {
    render(
      <LoadoutCard snapshot={mockSnapshot} stats={mockStats} gamesCount={10} />,
    );

    expect(screen.getByText('Gear & Weapons')).toBeInTheDocument();
    expect(screen.getByText('Rose')).toBeInTheDocument();
    expect(screen.getByText('Matador 64')).toBeInTheDocument();
    expect(screen.getByText('Gjallarhorn')).toBeInTheDocument();
    expect(screen.getByAltText('Rose')).toHaveAttribute(
      'src',
      'https://www.bungie.net/rose.png',
    );
    expect(screen.getByAltText('Gjallarhorn')).toHaveAttribute(
      'src',
      'https://www.bungie.net/gjallarfoam.png',
    );
  });

  it('triggers onClick handler when card is clicked', () => {
    const handleClick = vi.fn();
    render(
      <LoadoutCard
        snapshot={mockSnapshot}
        stats={mockStats}
        gamesCount={5}
        onClick={handleClick}
      />,
    );

    const cardTitle = screen.getByText('PvP Meta Loadout');
    fireEvent.click(cardTitle);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('opens weapon tooltip when tapping a gear pill without triggering card navigation', () => {
    const handleClick = vi.fn();
    const snapshotWithWeaponStats = {
      ...mockSnapshot,
      loadout: {
        ...mockSnapshot.loadout,
        1498876634: {
          ...mockSnapshot.loadout[1498876634],
          details: {
            ...mockSnapshot.loadout[1498876634].details,
            stats: {
              1240592695: { hash: 1240592695, name: 'Range', value: 72 },
            },
          },
        },
      },
    } as unknown as CharacterSnapshot;

    render(
      <LoadoutCard
        snapshot={snapshotWithWeaponStats}
        stats={mockStats}
        gamesCount={5}
        onClick={handleClick}
      />,
    );

    const rosePill = screen.getByRole('button', { name: /rose/i });
    fireEvent.pointerDown(rosePill);
    fireEvent.click(rosePill);

    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getAllByText('Range').length).toBeGreaterThan(0);
  });

  it('does not render set bonus pills when armorSetBonuses is empty or undefined', () => {
    render(
      <LoadoutCard snapshot={mockSnapshot} stats={mockStats} gamesCount={5} />,
    );
    expect(
      screen.queryByTestId('loadout-card-set-bonuses'),
    ).not.toBeInTheDocument();
  });

  it('renders compact set bonus pills with perk detail tooltips and stops card click propagation', () => {
    const handleClick = vi.fn();
    const snapshotWithBonuses = {
      ...mockSnapshot,
      armorSetBonuses: [
        {
          setHash: 742845781n,
          setName: 'Cruel Electrum',
          activeCount: 2,
          activePerks: [
            {
              requiredSetCount: 2,
              hash: 2562518502n,
              name: 'Primary Survivor',
              description: 'Boosts Primary weapons when allies fall.',
              iconPath: '/icons/survivor.png',
            },
          ],
        },
        {
          setHash: 2618364783n,
          setName: 'Per Audacia',
          activeCount: 4,
          activePerks: [
            {
              requiredSetCount: 2,
              hash: 3091068916n,
              name: 'Primary Chain',
              description: 'Grants stacking mobility on Primary kills.',
              iconPath: '/icons/chain.png',
            },
            {
              requiredSetCount: 4,
              hash: 3091068917n,
              name: 'Sublime Transit',
              description: 'Enhances sprint speed and slide distance.',
              iconPath: '/icons/transit.png',
            },
          ],
        },
      ],
    } as unknown as CharacterSnapshot;

    render(
      <LoadoutCard
        snapshot={snapshotWithBonuses}
        stats={mockStats}
        gamesCount={10}
        onClick={handleClick}
      />,
    );

    expect(screen.getByTestId('loadout-card-set-bonuses')).toBeInTheDocument();
    const electrumPill = screen.getByTestId('armor-set-bonus-pill-742845781');
    const audaciaPill = screen.getByTestId('armor-set-bonus-pill-2618364783');
    expect(electrumPill).toHaveTextContent('Cruel Electrum');
    expect(electrumPill).toHaveTextContent('(2pc)');
    expect(audaciaPill).toHaveTextContent('Per Audacia');
    expect(audaciaPill).toHaveTextContent('(4pc)');

    fireEvent.pointerDown(audaciaPill);
    fireEvent.click(audaciaPill);
    expect(handleClick).not.toHaveBeenCalled();

    const primaryChainMatches = screen.getAllByText('Primary Chain');
    expect(primaryChainMatches.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sublime Transit').length).toBeGreaterThan(0);

    fireEvent.click(primaryChainMatches[0]);
    expect(handleClick).not.toHaveBeenCalled();

    fireEvent.pointerDown(audaciaPill);
    fireEvent.click(audaciaPill);
    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.queryByText('Primary Chain')).not.toBeInTheDocument();
  });
});
