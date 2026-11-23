import { describe, expect, it } from 'vitest';
import type { Aggregate, CharacterSnapshot } from '~/api';

import {
  classifyMapSignal,
  generateMapTelemetry,
  generateMatchSeries,
  timeWindowToCustom,
} from './metrics';

function makeAgg(overrides: {
  id: string;
  period: string;
  location: string;
  kills: number;
  deaths: number;
  assists: number;
  standing: number;
  snapshotId?: string;
  activity?: string;
  estimatedGameMode?: 'quickplay' | 'competitive' | 'trials' | 'ironBanner';
}): Aggregate {
  return {
    id: overrides.id,
    activityId: `act-${overrides.id}`,
    sessionIds: [],
    characterIds: ['char-1'],
    snapshotIds: overrides.snapshotId ? [overrides.snapshotId] : [],
    createdAt: new Date(overrides.period),
    activityDetails: {
      location: overrides.location,
      activity: overrides.activity ?? 'Control',
      description: 'Control',
      period: new Date(overrides.period),
      referenceId: 1n,
      activityHash: 1n,
      activityIcon: '/icon.png',
      instanceId: `inst-${overrides.id}`,
      imageUrl: '/map.png',
      estimatedGameMode: overrides.estimatedGameMode,
    },
    snapshotLinks: overrides.snapshotId
      ? {
          'char-1': {
            characterId: 'char-1',
            snapshotId: overrides.snapshotId,
            confidenceLevel: 'high',
            confidenceSource: 'system',
            createdAt: new Date(overrides.period),
          },
        }
      : {},
    performance: {
      'char-1': {
        playerStats: {
          kills: { value: overrides.kills },
          deaths: { value: overrides.deaths },
          assists: { value: overrides.assists },
          standing: { value: overrides.standing },
        },
        weapons: {},
      },
    },
  };
}

describe('metrics telemetry helpers', () => {
  it('never inserts synthetic zero/default calendar buckets across multi-month gaps', () => {
    const aggs = [
      makeAgg({
        id: '1',
        period: '2026-09-10T18:00:00Z',
        location: 'Eternity',
        kills: 20,
        deaths: 10,
        assists: 5,
        standing: 0,
      }),
      makeAgg({
        id: '2',
        period: '2026-11-15T18:00:00Z',
        location: 'Midtown',
        kills: 15,
        deaths: 10,
        assists: 6,
        standing: 0,
      }),
    ];

    const window = timeWindowToCustom('all-time', aggs);
    const { points, summary } = generateMatchSeries(aggs, window, 'char-1');

    expect(points).toHaveLength(2);
    expect(points[0].matchIndex).toBe(1);
    expect(points[1].matchIndex).toBe(2);
    expect(summary.games).toBe(2);
    expect(summary.kd).toBe(1.75);
    expect(summary.winPct).toBe(100);
  });

  it('computes pooled rolling K/D and min/max consistency band bounds accurately', () => {
    const aggs = [
      makeAgg({
        id: '1',
        period: '2026-11-01T10:00:00Z',
        location: 'Javelin-4',
        kills: 10,
        deaths: 10,
        assists: 2,
        standing: 1,
      }),
      makeAgg({
        id: '2',
        period: '2026-11-01T10:15:00Z',
        location: 'Endless Vale',
        kills: 12,
        deaths: 0,
        assists: 4,
        standing: 0,
      }),
      makeAgg({
        id: '3',
        period: '2026-11-01T10:30:00Z',
        location: 'Burnout',
        kills: 8,
        deaths: 10,
        assists: 4,
        standing: 1,
      }),
    ];

    const window = timeWindowToCustom('all-time', aggs);
    const { points } = generateMatchSeries(
      aggs,
      window,
      'char-1',
      'allGameModes',
      3,
    );

    expect(points[2].rollingKd).toBe(1.5);
    expect(points[2].rollingKda).toBe(2);
    expect(points[2].kdBand).toEqual([0.8, 12]);
  });

  it('returns null trend deltas on All Time and computes relative deltas when prior matches exist before the selected window', () => {
    const aggs = [
      makeAgg({
        id: '1',
        period: '2026-11-01T10:00:00Z',
        location: 'Map A',
        kills: 10,
        deaths: 10,
        assists: 2,
        standing: 1,
      }),
      makeAgg({
        id: '2',
        period: '2026-11-01T10:15:00Z',
        location: 'Map A',
        kills: 10,
        deaths: 10,
        assists: 2,
        standing: 1,
      }),
      makeAgg({
        id: '3',
        period: '2026-11-01T10:30:00Z',
        location: 'Map A',
        kills: 10,
        deaths: 10,
        assists: 2,
        standing: 1,
      }),
      makeAgg({
        id: '4',
        period: '2026-11-02T10:00:00Z',
        location: 'Map B',
        kills: 20,
        deaths: 10,
        assists: 5,
        standing: 0,
      }),
      makeAgg({
        id: '5',
        period: '2026-11-02T10:15:00Z',
        location: 'Map B',
        kills: 20,
        deaths: 10,
        assists: 5,
        standing: 0,
      }),
      makeAgg({
        id: '6',
        period: '2026-11-02T10:30:00Z',
        location: 'Map B',
        kills: 20,
        deaths: 10,
        assists: 5,
        standing: 0,
      }),
    ];

    const allTimeWindow = timeWindowToCustom('all-time', aggs);
    const { summary: allTimeSummary } = generateMatchSeries(
      aggs,
      allTimeWindow,
      'char-1',
    );
    expect(allTimeSummary.kdDelta).toBeNull();
    expect(allTimeSummary.kdaDelta).toBeNull();
    expect(allTimeSummary.winPctDelta).toBeNull();

    const dayTwoWindow = {
      start: new Date('2026-11-02T00:00:00Z'),
      end: new Date('2026-11-02T23:59:59Z'),
    };
    const { summary: dayTwoSummary } = generateMatchSeries(
      aggs,
      dayTwoWindow,
      'char-1',
    );
    expect(dayTwoSummary.kdDelta).toBe(1);
    expect(dayTwoSummary.winPctDelta).toBe(100);
  });

  it('classifies Strong, Swap, Neutral, and Low-Sample maps and resolves top loadout per map', () => {
    expect(classifyMapSignal(1, 2.5, 100)).toBe('low-sample');
    expect(classifyMapSignal(3, 1.6, 67)).toBe('strong');
    expect(classifyMapSignal(3, 0.8, 33)).toBe('swap');
    expect(classifyMapSignal(4, 1.05, 25)).toBe('swap');
    expect(classifyMapSignal(3, 1.1, 67)).toBe('neutral');

    const snapshots = {
      'snap-pulse': { id: 'snap-pulse', name: 'Pulse Build' },
      'snap-hc': { id: 'snap-hc', name: 'Hand Cannon Build' },
    } as unknown as Record<string, CharacterSnapshot>;

    const aggs = [
      makeAgg({
        id: '1',
        period: '2026-11-10T10:00:00Z',
        location: 'Wormhaven',
        kills: 8,
        deaths: 14,
        assists: 4,
        standing: 1,
        snapshotId: 'snap-pulse',
      }),
      makeAgg({
        id: '2',
        period: '2026-11-10T10:20:00Z',
        location: 'Wormhaven',
        kills: 18,
        deaths: 10,
        assists: 6,
        standing: 0,
        snapshotId: 'snap-hc',
      }),
      makeAgg({
        id: '3',
        period: '2026-11-10T10:40:00Z',
        location: 'Wormhaven',
        kills: 16,
        deaths: 10,
        assists: 5,
        standing: 0,
        snapshotId: 'snap-hc',
      }),
    ];

    const window = timeWindowToCustom('all-time', aggs);
    const mapTelemetry = generateMapTelemetry(
      aggs,
      window,
      'char-1',
      'allGameModes',
      snapshots,
    );

    expect(mapTelemetry).toHaveLength(1);
    expect(mapTelemetry[0].location).toBe('Wormhaven');
    expect(mapTelemetry[0].bestLoadout).toEqual({
      snapshotId: 'snap-hc',
      name: 'Hand Cannon Build',
      kd: 1.7,
      winPct: 100,
      count: 2,
    });
  });

  it('filters matches by estimatedGameMode when provided', () => {
    const aggs = [
      makeAgg({
        id: '1',
        period: '2026-11-10T10:00:00Z',
        location: 'Javelin-4',
        kills: 15,
        deaths: 10,
        assists: 4,
        standing: 0,
        activity: 'Unknown Playlist',
        estimatedGameMode: 'trials',
      }),
      makeAgg({
        id: '2',
        period: '2026-11-10T10:20:00Z',
        location: 'Midtown',
        kills: 20,
        deaths: 10,
        assists: 5,
        standing: 0,
        activity: 'Control',
        estimatedGameMode: 'quickplay',
      }),
    ];

    const window = timeWindowToCustom('all-time', aggs);
    const { points } = generateMatchSeries(aggs, window, 'char-1', 'trials');
    expect(points).toHaveLength(1);
    expect(points[0].location).toBe('Javelin-4');
  });
});
