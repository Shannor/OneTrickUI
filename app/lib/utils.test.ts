import { describe, expect, it } from 'vitest';
import type { BaseItemInfo, Socket } from '~/api';
import { getItemIconUrl, setBungieUrl } from './utils';

describe('setBungieUrl', () => {
  it('prefixes relative paths and ignores empty or bare Bungie host URLs', () => {
    expect(setBungieUrl(undefined)).toBe('');
    expect(setBungieUrl('')).toBe('');
    expect(setBungieUrl('https://www.bungie.net')).toBe('');
    expect(setBungieUrl('/common/destiny2_content/icons/test.jpg')).toBe(
      'https://www.bungie.net/common/destiny2_content/icons/test.jpg',
    );
    expect(
      setBungieUrl('https://www.bungie.net/common/destiny2_content/icons/test.jpg'),
    ).toBe('https://www.bungie.net/common/destiny2_content/icons/test.jpg');
  });
});

describe('getItemIconUrl', () => {
  it('prefers styleBasicInfo.icon when present', () => {
    expect(
      getItemIconUrl(
        {
          baseInfo: {
            icon: '/base.jpg',
            itemTypeDisplayName: 'Chest Armor',
            styleBasicInfo: {
              icon: '/transmog.jpg',
            } as BaseItemInfo,
          },
        },
        '/fallback.jpg',
      ),
    ).toBe('https://www.bungie.net/transmog.jpg');
  });

  it('falls back to an active ornament socket when styleBasicInfo is absent', () => {
    const sockets: Socket[] = [
      {
        plugHash: 1,
        name: 'Trickster',
        description: '',
        icon: '/trickster.jpg',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: 'Hunter Ornament',
      },
    ];

    expect(
      getItemIconUrl({
        baseInfo: {
          icon: '/gemini.jpg',
          itemTypeDisplayName: 'Leg Armor',
        },
        sockets,
      }),
    ).toBe('https://www.bungie.net/trickster.jpg');
  });

  it('falls back to a synthweave armor socket matching base itemTypeDisplayName', () => {
    const sockets: Socket[] = [
      {
        plugHash: 2,
        name: 'Iron Companion Vest',
        description: '',
        icon: '/iron-companion.jpg',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: 'Chest Armor',
      },
    ];

    expect(
      getItemIconUrl({
        baseInfo: {
          icon: '/base-vest.jpg',
          itemTypeDisplayName: 'Chest Armor',
        },
        sockets,
      }),
    ).toBe('https://www.bungie.net/iron-companion.jpg');
  });

  it('ignores Default Ornament restore sockets and disabled/hidden sockets', () => {
    const sockets: Socket[] = [
      {
        plugHash: 702981643,
        name: 'Default Ornament',
        description: 'Restores your armor to its default appearance.',
        icon: '/default-ornament.png',
        isEnabled: true,
        isVisible: true,
        itemTypeDisplayName: 'Restore Defaults',
      },
      {
        plugHash: 99,
        name: 'Hidden Ornament',
        description: '',
        icon: '/hidden.jpg',
        isEnabled: true,
        isVisible: false,
        itemTypeDisplayName: 'Hunter Universal Ornament',
      },
    ];

    expect(
      getItemIconUrl({
        baseInfo: {
          icon: '/bombardiers.jpg',
          itemTypeDisplayName: 'Leg Armor',
        },
        sockets,
      }),
    ).toBe('https://www.bungie.net/bombardiers.jpg');
  });

  it('uses fallbackIcon when baseInfo has no icon', () => {
    expect(getItemIconUrl(undefined, '/display-icon.jpg')).toBe(
      'https://www.bungie.net/display-icon.jpg',
    );
    expect(getItemIconUrl(undefined)).toBe('');
  });
});
