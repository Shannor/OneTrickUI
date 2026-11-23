import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ArmorSetBonus, CharacterSnapshot, ItemSnapshot } from '~/api';
import { ArmorBuckets } from '~/constants/hashes';

import { ArmorSet } from './armor-set';

function buildArmorPiece(
  bucketHash: number,
  name: string,
  itemTypeDisplayName: string,
): ItemSnapshot {
  return {
    instanceId: `inst-${bucketHash}`,
    name,
    itemHash: BigInt(bucketHash),
    bucketHash: BigInt(bucketHash),
    details: {
      baseInfo: {
        name,
        icon: `/${bucketHash}.png`,
        itemHash: BigInt(bucketHash),
        instanceId: `inst-${bucketHash}`,
        bucketHash: BigInt(bucketHash),
        itemTypeAndTierDisplayName: `Legendary ${itemTypeDisplayName}`,
        itemTypeDisplayName,
        tierTypeName: 'Legendary',
        tierType: 5,
      },
      perks: [],
      stats: {},
      sockets: [
        {
          plugHash: 100 + bucketHash,
          name: 'Stat Mod',
          description: 'Increases stat',
          icon: '/mod.png',
          isEnabled: true,
          isVisible: true,
          itemTypeDisplayName: 'Armor Mod',
        },
      ],
    },
  };
}

function buildSnapshot(armorSetBonuses?: ArmorSetBonus[]): CharacterSnapshot {
  return {
    id: 'snap-1',
    name: 'Trials Hunter',
    userId: 'user-1',
    characterId: 'char-1',
    hash: 'hash-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    armorSetBonuses,
    loadout: {
      [ArmorBuckets.Helmet]: buildArmorPiece(
        ArmorBuckets.Helmet,
        'Cruel Electrum Mask',
        'Helmet',
      ),
      [ArmorBuckets.Gauntlets]: buildArmorPiece(
        ArmorBuckets.Gauntlets,
        'Cruel Electrum Grips',
        'Gauntlets',
      ),
      [ArmorBuckets.Chest]: buildArmorPiece(
        ArmorBuckets.Chest,
        'Cruel Electrum Vest',
        'Chest Armor',
      ),
      [ArmorBuckets.Legs]: buildArmorPiece(
        ArmorBuckets.Legs,
        'Cruel Electrum Strides',
        'Leg Armor',
      ),
      [ArmorBuckets.ClassItem]: buildArmorPiece(
        ArmorBuckets.ClassItem,
        'Cruel Electrum Cloak',
        'Hunter Cloak',
      ),
    },
  };
}

describe('ArmorSet', () => {
  it('renders all 5 armor pieces without Active Set Bonuses clutter when armorSetBonuses is empty or undefined', () => {
    const { rerender } = render(<ArmorSet snapshot={buildSnapshot(undefined)} />);

    expect(screen.getByText('Cruel Electrum Mask')).toBeInTheDocument();
    expect(screen.getByText('Cruel Electrum Cloak')).toBeInTheDocument();
    expect(screen.queryByTestId('active-set-bonuses')).not.toBeInTheDocument();
    expect(screen.queryByText('Active Set Bonuses')).not.toBeInTheDocument();

    rerender(<ArmorSet snapshot={buildSnapshot([])} />);
    expect(screen.queryByTestId('active-set-bonuses')).not.toBeInTheDocument();
  });

  it('displays active 2-piece and 4-piece bonuses alongside the 5 armor pieces', () => {
    const snapshot = buildSnapshot([
      {
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
      },
    ]);

    render(<ArmorSet snapshot={snapshot} />);

    expect(screen.getByText('Cruel Electrum Mask')).toBeInTheDocument();
    expect(screen.getByTestId('active-set-bonuses')).toBeInTheDocument();
    expect(screen.getByText('Cruel Electrum')).toBeInTheDocument();
    expect(screen.getByText('4-Piece Set')).toBeInTheDocument();
    expect(screen.getByText('Primary Survivor')).toBeInTheDocument();
    expect(screen.getByText('2-Piece')).toBeInTheDocument();
    expect(
      screen.getByText('Boosts Primary weapons when allies fall.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Primary Phantom')).toBeInTheDocument();
    expect(screen.getByText('4-Piece')).toBeInTheDocument();
    expect(
      screen.getByText('Primary final blows hide you from radar.'),
    ).toBeInTheDocument();
    expect(screen.getByAltText('Primary Survivor')).toHaveAttribute(
      'src',
      'https://www.bungie.net/icons/survivor.png',
    );
  });

  it('displays 2+2 split set bonuses cleanly', () => {
    const snapshot = buildSnapshot([
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
        activeCount: 2,
        activePerks: [
          {
            requiredSetCount: 2,
            hash: 3091068916n,
            name: 'Primary Chain',
            description: 'Primary final blows increase mobility and range.',
            iconPath: '/icons/chain.png',
          },
        ],
      },
    ]);

    render(<ArmorSet snapshot={snapshot} />);

    expect(screen.getByText('2 Active Sets')).toBeInTheDocument();
    expect(screen.getByText('Cruel Electrum')).toBeInTheDocument();
    expect(screen.getByText('Per Audacia')).toBeInTheDocument();
    expect(screen.getAllByText('2-Piece Set')).toHaveLength(2);
    expect(screen.getByText('Primary Survivor')).toBeInTheDocument();
    expect(screen.getByText('Primary Chain')).toBeInTheDocument();
  });
});
