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
});
