import { describe, expect, it } from 'vitest';
import type { ActivityAggregate, LoadoutSnapshot, Session } from '~/api';

import {
  generateLoadoutOgPng,
  generateSessionOgPng,
  getFallbackOgPng,
} from './og-image';

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

describe('og-image generator', () => {
  it('generates a valid 1200x630 PNG for a session', async () => {
    const session: Session = {
      id: 'sess-123',
      userId: 'user-1',
      characterId: 'char-1',
      name: 'Trials Flawless Run',
      status: 'completed',
      startedAt: '2026-03-01T18:00:00Z',
      completedAt: '2026-03-01T20:00:00Z',
      aggregateIds: ['agg-1', 'agg-2'],
    };

    const aggregates: ActivityAggregate[] = [
      {
        id: 'agg-1',
        activityDetails: {
          instanceId: '1',
          mode: 'Trials of Osiris',
          activity: 'Competitive',
          location: 'Javelin-4',
          period: '2026-03-01T18:15:00Z',
          imageUrl: '',
          activityIcon: '',
          isPrivate: false,
        },
        performance: {
          'char-1': {
            playerStats: {
              kills: { value: 14, displayValue: '14' },
              deaths: { value: 4, displayValue: '4' },
              assists: { value: 5, displayValue: '5' },
              standing: { value: 0, displayValue: 'Victory' },
            },
          } as unknown as ActivityAggregate['performance'][string],
        },
        snapshotLinks: {},
        teams: [],
      },
      {
        id: 'agg-2',
        activityDetails: {
          instanceId: '2',
          mode: 'Trials of Osiris',
          activity: 'Competitive',
          location: 'Burnout',
          period: '2026-03-01T18:30:00Z',
          imageUrl: '',
          activityIcon: '',
          isPrivate: false,
        },
        performance: {
          'char-1': {
            playerStats: {
              kills: { value: 10, displayValue: '10' },
              deaths: { value: 6, displayValue: '6' },
              assists: { value: 3, displayValue: '3' },
              standing: { value: 0, displayValue: 'Victory' },
            },
          } as unknown as ActivityAggregate['performance'][string],
        },
        snapshotLinks: {},
        teams: [],
      },
    ];

    const png = await generateSessionOgPng({
      session,
      aggregates,
      displayName: 'Guardian#1234',
      characterClass: 'Hunter',
    });

    expect(png.byteLength).toBeGreaterThan(1000);
    expect(png.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    // IHDR width (bytes 16..20) and height (bytes 20..24)
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  it('generates a valid 1200x630 PNG for a loadout snapshot', async () => {
    const snapshot = {
      id: 'snap-123',
      name: 'Solar Hand Cannon Build',
      userId: 'user-1',
      characterId: 'char-1',
      createdAt: '2026-03-01T18:00:00Z',
      loadout: {
        kinetic: {
          hash: 1,
          name: 'Ace of Spades',
          itemType: 'Hand Cannon',
          iconUrl: '',
        },
        energy: {
          hash: 2,
          name: 'Felwinter Lie',
          itemType: 'Shotgun',
          iconUrl: '',
        },
        power: {
          hash: 3,
          name: 'Hammerhead',
          itemType: 'Machine Gun',
          iconUrl: '',
        },
        subclass: {
          hash: 4,
          name: 'Gunslinger',
          itemType: 'Subclass',
          iconUrl: '',
        },
      },
    } as unknown as LoadoutSnapshot;

    const png = await generateLoadoutOgPng({
      snapshot,
      displayName: 'Guardian#1234',
      characterClass: 'Hunter',
    });

    expect(png.byteLength).toBeGreaterThan(1000);
    expect(png.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  it('returns the default fallback PNG buffer', async () => {
    const fallback = await getFallbackOgPng();
    expect(fallback.byteLength).toBeGreaterThan(1000);
    expect(fallback.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    expect(fallback.readUInt32BE(16)).toBe(1200);
    expect(fallback.readUInt32BE(20)).toBe(630);
  });
});
