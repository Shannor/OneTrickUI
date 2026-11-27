import { describe, expect, it } from 'vitest';
import type { ItemProperties, ItemSnapshot, Socket } from '~/api';

import {
  EMPTY_CATALYST_SOCKET_HASH,
  EMPTY_CRAFTED_CATALYST_SOCKET_HASH,
  EMPTY_ENHANCEMENT_SOCKET_HASH,
  EMPTY_GEAR_TIER_UPGRADE_SOCKET_HASH,
  findCatalystMarkerSocket,
  findEnhancedSocket,
  getExoticCatalystState,
  isEmptyCatalystSocket,
  isEnhancedSocket,
  isEnhancedWeapon,
  isExoticCatalystSocket,
  toSlimEnhancedSocket,
} from './weapon-enhancement';

function makeSocket(overrides: Partial<Socket> = {}): Socket {
  return {
    plugHash: 1001,
    name: 'Opening Shot',
    description: 'Improved accuracy and range on the opening shot.',
    icon: '/opening-shot.png',
    isEnabled: true,
    isVisible: true,
    itemTypeDisplayName: 'Trait',
    itemTypeTieredDisplayName: 'Basic Trait',
    ...overrides,
  };
}

describe('isEnhancedSocket', () => {
  it('returns false for null, undefined, or disabled sockets', () => {
    expect(isEnhancedSocket(null)).toBe(false);
    expect(isEnhancedSocket(undefined)).toBe(false);
    expect(
      isEnhancedSocket(
        makeSocket({
          isEnabled: false,
          itemTypeDisplayName: 'Enhanced Trait',
        }),
      ),
    ).toBe(false);
    expect(
      isEnhancedSocket(
        makeSocket({
          isEnabled: undefined,
          itemTypeDisplayName: 'Enhanced Trait',
        }),
      ),
    ).toBe(false);
  });

  it('returns false for base traits, intrinsics, and empty enhancement/tier upgrade sockets', () => {
    expect(isEnhancedSocket(makeSocket())).toBe(false);
    expect(
      isEnhancedSocket(
        makeSocket({
          itemTypeDisplayName: 'Intrinsic',
          itemTypeTieredDisplayName: 'Legendary Intrinsic',
        }),
      ),
    ).toBe(false);
    expect(
      isEnhancedSocket(
        makeSocket({
          plugHash: EMPTY_ENHANCEMENT_SOCKET_HASH,
          name: 'Empty Enhancement Socket',
          itemTypeDisplayName: '',
          itemTypeTieredDisplayName: '',
        }),
      ),
    ).toBe(false);
    expect(
      isEnhancedSocket(
        makeSocket({
          plugHash: EMPTY_GEAR_TIER_UPGRADE_SOCKET_HASH,
          name: 'Empty Gear Tier Upgrade',
          itemTypeDisplayName: '',
          itemTypeTieredDisplayName: '',
        }),
      ),
    ).toBe(false);
    expect(
      isEnhancedSocket(
        makeSocket({
          plugHash: 9999,
          name: 'Tier 1 Upgrade',
          itemTypeDisplayName: '',
          itemTypeTieredDisplayName: '',
        }),
      ),
    ).toBe(false);
  });

  it('detects enhanced traits, intrinsics, barrels, magazines, mods, and origin traits via display names', () => {
    expect(
      isEnhancedSocket(
        makeSocket({
          itemTypeDisplayName: 'Enhanced Trait',
          itemTypeTieredDisplayName: 'Common Enhanced Trait',
        }),
      ),
    ).toBe(true);

    expect(
      isEnhancedSocket(
        makeSocket({
          itemTypeDisplayName: 'Enhanced Intrinsic',
          itemTypeTieredDisplayName: 'Legendary Enhanced Intrinsic',
        }),
      ),
    ).toBe(true);

    expect(
      isEnhancedSocket(
        makeSocket({
          itemTypeDisplayName: 'Trait',
          itemTypeTieredDisplayName: 'Common Enhanced Trait',
        }),
      ),
    ).toBe(true);

    expect(
      isEnhancedSocket(
        makeSocket({
          itemTypeDisplayName: 'Enhanced Barrel',
          itemTypeTieredDisplayName: '',
        }),
      ),
    ).toBe(true);

    expect(
      isEnhancedSocket(
        makeSocket({
          itemTypeDisplayName: 'Enhanced Origin Trait',
          itemTypeTieredDisplayName: '',
        }),
      ),
    ).toBe(true);
  });

  it('detects active Enhancement 1-3 plugs by plugHash and name even with empty display names', () => {
    for (const [plugHash, name] of [
      [2728416798, 'Enhancement 1'],
      [2728416797, 'Enhancement 2'],
      [2728416796, 'Enhancement 3'],
    ] as const) {
      expect(
        isEnhancedSocket(
          makeSocket({
            plugHash,
            name,
            isVisible: false,
            itemTypeDisplayName: '',
            itemTypeTieredDisplayName: '',
          }),
        ),
      ).toBe(true);
    }

    expect(
      isEnhancedSocket(
        makeSocket({
          plugHash: 424242,
          name: 'Enhancement 2',
          itemTypeDisplayName: '',
          itemTypeTieredDisplayName: '',
        }),
      ),
    ).toBe(true);
  });

  it('detects active Tier 2-5 Upgrade plugs by name', () => {
    for (const tier of [2, 3, 4, 5]) {
      expect(
        isEnhancedSocket(
          makeSocket({
            plugHash: 5000 + tier,
            name: `Tier ${tier} Upgrade`,
            isVisible: false,
            itemTypeDisplayName: '',
            itemTypeTieredDisplayName: '',
          }),
        ),
      ).toBe(true);
    }
  });
});

describe('isEnhancedWeapon', () => {
  it('returns false for null, undefined, or weapons without enhanced sockets', () => {
    expect(isEnhancedWeapon(null)).toBe(false);
    expect(isEnhancedWeapon(undefined)).toBe(false);

    const properties = {
      baseInfo: { name: 'Rose', bucketHash: 1498876634n },
      perks: [],
      stats: {},
      sockets: [makeSocket()],
    } as unknown as ItemProperties;

    expect(isEnhancedWeapon(properties)).toBe(false);
  });

  it('detects enhanced weapons from ItemProperties and ItemSnapshot', () => {
    const enhancedSocket = makeSocket({
      plugHash: 2728416797,
      name: 'Enhancement 2',
      isVisible: false,
      itemTypeDisplayName: '',
      itemTypeTieredDisplayName: '',
    });

    const properties = {
      baseInfo: { name: 'Rose', bucketHash: 1498876634n },
      perks: [],
      stats: {},
      sockets: [makeSocket(), enhancedSocket],
    } as unknown as ItemProperties;

    const snapshot = {
      itemHash: 1498876634n,
      instanceId: 'inst-1',
      name: 'Rose',
      details: properties,
    } as unknown as ItemSnapshot;

    expect(isEnhancedWeapon(properties)).toBe(true);
    expect(isEnhancedWeapon(snapshot)).toBe(true);
  });

  it('returns false for armor and subclass buckets even if a socket matches an upgrade name', () => {
    const armorSnapshot = {
      itemHash: 3448274439n,
      instanceId: 'armor-1',
      name: 'Artifice Helmet',
      details: {
        baseInfo: { name: 'Artifice Helmet', bucketHash: 3448274439n },
        perks: [],
        stats: {},
        sockets: [
          makeSocket({
            name: 'Tier 5 Upgrade',
            itemTypeDisplayName: '',
            itemTypeTieredDisplayName: '',
          }),
        ],
      },
    } as unknown as ItemSnapshot;

    expect(isEnhancedWeapon(armorSnapshot)).toBe(false);
  });
});

describe('findEnhancedSocket & toSlimEnhancedSocket', () => {
  it('preserves minimal fields needed for enhanced detection while clearing verbose description and icon', () => {
    const sockets = [
      makeSocket(),
      makeSocket({
        plugHash: 2002,
        name: 'Slideshot',
        description: 'Very long Bungie manifest description...',
        icon: '/very/long/path/icon.png',
        itemTypeDisplayName: 'Enhanced Trait',
        itemTypeTieredDisplayName: 'Common Enhanced Trait',
      }),
    ];

    const match = findEnhancedSocket(sockets);
    expect(match?.plugHash).toBe(2002);

    const slimmed = toSlimEnhancedSocket(match!);
    expect(slimmed).toEqual({
      plugHash: 2002,
      name: 'Slideshot',
      description: '',
      icon: '',
      isEnabled: true,
      isVisible: true,
      itemTypeDisplayName: 'Enhanced Trait',
      itemTypeTieredDisplayName: 'Common Enhanced Trait',
    });
    expect(isEnhancedSocket(slimmed)).toBe(true);
  });
});

describe('isEmptyCatalystSocket & isExoticCatalystSocket', () => {
  it('identifies empty catalyst sockets by known hashes and name', () => {
    expect(
      isEmptyCatalystSocket(
        makeSocket({
          plugHash: EMPTY_CATALYST_SOCKET_HASH,
          name: 'Empty Catalyst Socket',
          itemTypeDisplayName: '',
        }),
      ),
    ).toBe(true);

    expect(
      isEmptyCatalystSocket(
        makeSocket({
          plugHash: EMPTY_CRAFTED_CATALYST_SOCKET_HASH,
          name: 'Empty Catalyst Socket',
          itemTypeDisplayName: '',
        }),
      ),
    ).toBe(true);

    expect(
      isEmptyCatalystSocket(
        makeSocket({
          plugHash: 999999,
          name: 'Empty Catalyst Slot',
          itemTypeDisplayName: '',
        }),
      ),
    ).toBe(true);

    expect(
      isEmptyCatalystSocket(
        makeSocket({
          plugHash: EMPTY_CATALYST_SOCKET_HASH,
          name: 'Empty Catalyst Socket',
          isEnabled: false,
        }),
      ),
    ).toBe(false);
  });

  it('detects active Exotic catalysts, masterwork upgrades, and craftable refits without matching Legendary masterworks', () => {
    expect(
      isExoticCatalystSocket(
        makeSocket({
          plugHash: 3947093900,
          name: 'Ace of Spades Catalyst',
          itemTypeDisplayName: '',
        }),
      ),
    ).toBe(true);

    expect(
      isExoticCatalystSocket(
        makeSocket({
          plugHash: 5001,
          name: 'Funeral Pyre',
          itemTypeDisplayName: 'Exotic Catalyst',
        }),
      ),
    ).toBe(true);

    expect(
      isExoticCatalystSocket(
        makeSocket({
          plugHash: 5002,
          name: 'Upgrade Masterwork',
          itemTypeDisplayName: '',
        }),
        { isExotic: true },
      ),
    ).toBe(true);

    expect(
      isExoticCatalystSocket(
        makeSocket({
          plugHash: 5003,
          name: 'Outlaw Refit',
          itemTypeDisplayName: '',
        }),
        { isExotic: true },
      ),
    ).toBe(true);

    expect(
      isExoticCatalystSocket(
        makeSocket({
          plugHash: 5004,
          name: 'Masterworked: Stability',
          itemTypeDisplayName: 'Weapon Masterwork',
        }),
        { isExotic: false },
      ),
    ).toBe(false);

    expect(
      isExoticCatalystSocket(
        makeSocket({
          plugHash: 5005,
          name: 'Upgrade Masterwork',
          itemTypeDisplayName: '',
        }),
        { isExotic: false },
      ),
    ).toBe(false);

    expect(
      isExoticCatalystSocket(
        makeSocket({
          plugHash: EMPTY_CATALYST_SOCKET_HASH,
          name: 'Empty Catalyst Socket',
          itemTypeDisplayName: '',
        }),
        { isExotic: true },
      ),
    ).toBe(false);
  });
});

describe('findCatalystMarkerSocket & getExoticCatalystState', () => {
  it('returns active, empty, or none accurately for Exotic weapons and ignores Legendary weapons or Exotic armor', () => {
    const activeCatalystSocket = makeSocket({
      plugHash: 3947093900,
      name: 'Ace of Spades Catalyst',
      itemTypeDisplayName: '',
    });
    const emptyCatalystSocket = makeSocket({
      plugHash: EMPTY_CATALYST_SOCKET_HASH,
      name: 'Empty Catalyst Socket',
      itemTypeDisplayName: '',
    });

    expect(
      findCatalystMarkerSocket(
        [emptyCatalystSocket, activeCatalystSocket],
        true,
      )?.plugHash,
    ).toBe(3947093900);
    expect(
      findCatalystMarkerSocket([emptyCatalystSocket], true)?.plugHash,
    ).toBe(EMPTY_CATALYST_SOCKET_HASH);
    expect(
      findCatalystMarkerSocket([activeCatalystSocket], false),
    ).toBeUndefined();

    const activeExotic = {
      baseInfo: {
        name: 'Ace of Spades',
        bucketHash: 1498876634n,
        tierType: 6,
        tierTypeName: 'Exotic',
      },
      perks: [],
      stats: {},
      sockets: [makeSocket(), activeCatalystSocket],
    } as unknown as ItemProperties;

    const emptyExotic = {
      baseInfo: {
        name: 'Truth',
        bucketHash: 953998645n,
        tierType: 6,
        tierTypeName: 'Exotic',
      },
      perks: [],
      stats: {},
      sockets: [makeSocket(), emptyCatalystSocket],
    } as unknown as ItemProperties;

    const noCatalystExotic = {
      baseInfo: {
        name: 'Chaperone',
        bucketHash: 1498876634n,
        tierType: 6,
        tierTypeName: 'Exotic',
      },
      perks: [],
      stats: {},
      sockets: [makeSocket()],
    } as unknown as ItemProperties;

    const exoticArmor = {
      itemHash: 3448274439n,
      instanceId: 'armor-1',
      name: 'Wormhusk Crown',
      details: {
        baseInfo: {
          name: 'Wormhusk Crown',
          bucketHash: 3448274439n,
          tierType: 6,
          tierTypeName: 'Exotic',
        },
        perks: [],
        stats: {},
        sockets: [activeCatalystSocket],
      },
    } as unknown as ItemSnapshot;

    expect(getExoticCatalystState(activeExotic)).toBe('active');
    expect(getExoticCatalystState(emptyExotic)).toBe('empty');
    expect(getExoticCatalystState(noCatalystExotic)).toBe('none');
    expect(getExoticCatalystState(exoticArmor)).toBe('none');
  });
});
