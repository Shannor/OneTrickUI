import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  Aggregate,
  ConfidenceLevel,
  GameMode,
  TelemetryMatch,
  TelemetrySnapshotSummary,
} from '~/api';

import {
  aggregatesToTelemetryMatches,
  classifyMapSignal,
  generateMapTelemetry,
  generateMatchSeries,
  timeWindowToCustom,
} from './metrics';

function makeMatch(overrides: {
  id: string;
  period: string;
  location?: string;
  kills: number;
  deaths: number;
  assists: number;
  won: boolean;
  snapshotId?: string;
  snapshotConfidence?: ConfidenceLevel;
  activity?: string;
  estimatedGameMode?: GameMode;
}): TelemetryMatch {
  return {
    activityId: `act-${overrides.id}`,
    period: new Date(overrides.period),
    location: overrides.location ?? 'Javelin-4',
    activity: overrides.activity ?? 'Control',
    estimatedGameMode: overrides.estimatedGameMode,
    kills: overrides.kills,
    deaths: overrides.deaths,
    assists: overrides.assists,
    won: overrides.won,
    snapshotId: overrides.snapshotId,
    snapshotConfidence:
      overrides.snapshotConfidence ??
      (overrides.snapshotId ? 'high' : undefined),
  };
}

describe('metrics telemetry helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles empty match lists safely across time window, series, and map helpers', () => {
    const window = timeWindowToCustom('all-time', []);
    expect(window.start.getTime()).toBeLessThan(window.end.getTime());

    const series = generateMatchSeries([], window);
    expect(series.points).toEqual([]);
    expect(series.summary).toEqual({
      games: 0,
      wins: 0,
      losses: 0,
      winPct: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      avgKills: 0,
      avgDeaths: 0,
      avgAssists: 0,
      kd: 0,
      kda: 0,
      kdDelta: null,
      kdaDelta: null,
      winPctDelta: null,
    });

    const maps = generateMapTelemetry([], window);
    expect(maps).toEqual([]);
  });

  it('resolves all preset time-window intervals and custom ranges accurately', () => {
    vi.useFakeTimers();
    const now = new Date('2026-11-24T18:00:00Z');
    vi.setSystemTime(now);

    const lastHour = timeWindowToCustom('last-hour', []);
    expect(lastHour.end.getTime() - lastHour.start.getTime()).toBe(
      60 * 60 * 1000,
    );

    const last3Hours = timeWindowToCustom('last-3-hours', []);
    expect(last3Hours.end.getTime() - last3Hours.start.getTime()).toBe(
      3 * 60 * 60 * 1000,
    );

    const last6Hours = timeWindowToCustom('last-6-hours', []);
    expect(last6Hours.end.getTime() - last6Hours.start.getTime()).toBe(
      6 * 60 * 60 * 1000,
    );

    const oneDay = timeWindowToCustom('one-day', []);
    expect(oneDay.start.getTime()).toBeLessThan(oneDay.end.getTime());

    const oneWeek = timeWindowToCustom('one-week', []);
    expect(oneWeek.start.getTime()).toBeLessThan(oneDay.start.getTime());

    const oneMonth = timeWindowToCustom('one-month', []);
    expect(oneMonth.start.getTime()).toBeLessThan(oneWeek.start.getTime());

    const sixMonths = timeWindowToCustom('six-months', []);
    expect(sixMonths.start.getTime()).toBeLessThan(oneMonth.start.getTime());

    const custom = {
      start: new Date('2026-11-01T00:00:00Z'),
      end: new Date('2026-11-10T00:00:00Z'),
    };
    expect(timeWindowToCustom(custom, [])).toBe(custom);

    const matches = [
      makeMatch({
        id: 'late',
        period: '2026-11-10T12:00:00Z',
        kills: 10,
        deaths: 10,
        assists: 2,
        won: true,
      }),
      makeMatch({
        id: 'early',
        period: '2026-11-01T12:00:00Z',
        kills: 12,
        deaths: 8,
        assists: 4,
        won: false,
      }),
    ];
    const allTime = timeWindowToCustom('all-time', matches);
    expect(allTime.start.toISOString()).toBe('2026-11-01T11:30:00.000Z');
    expect(allTime.end.toISOString()).toBe('2026-11-10T12:30:00.000Z');
  });

  it('never inserts synthetic zero/default calendar buckets across multi-month gaps', () => {
    const matches = [
      makeMatch({
        id: '1',
        period: '2026-09-10T18:00:00Z',
        location: 'Eternity',
        kills: 20,
        deaths: 10,
        assists: 5,
        won: true,
      }),
      makeMatch({
        id: '2',
        period: '2026-11-15T18:00:00Z',
        location: 'Midtown',
        kills: 15,
        deaths: 10,
        assists: 6,
        won: true,
      }),
    ];

    const window = timeWindowToCustom('all-time', matches);
    const { points, summary } = generateMatchSeries(matches, window);

    expect(points).toHaveLength(2);
    expect(points[0].matchIndex).toBe(1);
    expect(points[1].matchIndex).toBe(2);
    expect(summary.games).toBe(2);
    expect(summary.kd).toBe(1.75);
    expect(summary.winPct).toBe(100);
  });

  it('drops malformed period dates before sorting in generateMatchSeries and ignores them in map telemetry', () => {
    const matches = [
      makeMatch({
        id: 'late',
        period: '2026-11-15T18:00:00Z',
        location: 'Midtown',
        kills: 15,
        deaths: 10,
        assists: 4,
        won: true,
      }),
      makeMatch({
        id: 'invalid',
        period: 'not-a-valid-date',
        location: 'Corrupt Map',
        kills: 99,
        deaths: 1,
        assists: 0,
        won: true,
      }),
      makeMatch({
        id: 'early',
        period: '2026-11-10T18:00:00Z',
        location: 'Eternity',
        kills: 20,
        deaths: 10,
        assists: 5,
        won: false,
      }),
    ];

    const window = timeWindowToCustom('all-time', matches);
    const { points, summary } = generateMatchSeries(matches, window);

    expect(points.map((p) => p.activityId)).toEqual(['act-early', 'act-late']);
    expect(summary.games).toBe(2);

    const maps = generateMapTelemetry(matches, window);
    expect(maps.map((m) => m.location).sort()).toEqual(['Eternity', 'Midtown']);
  });

  it('computes pooled rolling K/D and min/max consistency band bounds accurately', () => {
    const matches = [
      makeMatch({
        id: '1',
        period: '2026-11-01T10:00:00Z',
        location: 'Javelin-4',
        kills: 10,
        deaths: 10,
        assists: 2,
        won: false,
      }),
      makeMatch({
        id: '2',
        period: '2026-11-01T10:15:00Z',
        location: 'Endless Vale',
        kills: 12,
        deaths: 0,
        assists: 4,
        won: true,
      }),
      makeMatch({
        id: '3',
        period: '2026-11-01T10:30:00Z',
        location: 'Burnout',
        kills: 8,
        deaths: 10,
        assists: 4,
        won: false,
      }),
    ];

    const window = timeWindowToCustom('all-time', matches);
    const { points } = generateMatchSeries(matches, window, 'allGameModes', 3);

    expect(points[2].rollingKd).toBe(1.5);
    expect(points[2].rollingKda).toBe(2);
    expect(points[2].kdBand).toEqual([0.8, 12]);
  });

  it('returns null trend deltas on All Time and computes relative deltas when prior matches exist before the selected window', () => {
    const matches = [
      makeMatch({
        id: '1',
        period: '2026-11-01T10:00:00Z',
        location: 'Map A',
        kills: 10,
        deaths: 10,
        assists: 2,
        won: false,
      }),
      makeMatch({
        id: '2',
        period: '2026-11-01T10:15:00Z',
        location: 'Map A',
        kills: 10,
        deaths: 10,
        assists: 2,
        won: false,
      }),
      makeMatch({
        id: '3',
        period: '2026-11-01T10:30:00Z',
        location: 'Map A',
        kills: 10,
        deaths: 10,
        assists: 2,
        won: false,
      }),
      makeMatch({
        id: '4',
        period: '2026-11-02T10:00:00Z',
        location: 'Map B',
        kills: 20,
        deaths: 10,
        assists: 5,
        won: true,
      }),
      makeMatch({
        id: '5',
        period: '2026-11-02T10:15:00Z',
        location: 'Map B',
        kills: 20,
        deaths: 10,
        assists: 5,
        won: true,
      }),
      makeMatch({
        id: '6',
        period: '2026-11-02T10:30:00Z',
        location: 'Map B',
        kills: 20,
        deaths: 10,
        assists: 5,
        won: true,
      }),
    ];

    const allTimeWindow = timeWindowToCustom('all-time', matches);
    const { summary: allTimeSummary } = generateMatchSeries(
      matches,
      allTimeWindow,
    );
    expect(allTimeSummary.kdDelta).toBeNull();
    expect(allTimeSummary.kdaDelta).toBeNull();
    expect(allTimeSummary.winPctDelta).toBeNull();

    const dayTwoWindow = {
      start: new Date('2026-11-02T00:00:00Z'),
      end: new Date('2026-11-02T23:59:59Z'),
    };
    const { summary: dayTwoSummary } = generateMatchSeries(
      matches,
      dayTwoWindow,
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

    const snapshots: Record<string, TelemetrySnapshotSummary> = {
      'snap-pulse': { id: 'snap-pulse', name: 'Pulse Build' },
      'snap-hc': { id: 'snap-hc', name: 'Hand Cannon Build' },
    };

    const matches = [
      makeMatch({
        id: '1',
        period: '2026-11-10T10:00:00Z',
        location: 'Wormhaven',
        kills: 8,
        deaths: 14,
        assists: 4,
        won: false,
        snapshotId: 'snap-pulse',
      }),
      makeMatch({
        id: '2',
        period: '2026-11-10T10:20:00Z',
        location: 'Wormhaven',
        kills: 18,
        deaths: 10,
        assists: 6,
        won: true,
        snapshotId: 'snap-hc',
      }),
      makeMatch({
        id: '3',
        period: '2026-11-10T10:40:00Z',
        location: 'Wormhaven',
        kills: 16,
        deaths: 10,
        assists: 5,
        won: true,
        snapshotId: 'snap-hc',
      }),
    ];

    const window = timeWindowToCustom('all-time', matches);
    const mapTelemetry = generateMapTelemetry(
      matches,
      window,
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

  it('filters matches strictly via estimatedGameMode without falling back to activity strings', () => {
    const matches = [
      makeMatch({
        id: '1',
        period: '2026-11-10T10:00:00Z',
        location: 'Javelin-4',
        kills: 15,
        deaths: 10,
        assists: 4,
        won: true,
        activity: 'Unknown Playlist',
        estimatedGameMode: 'trials',
      }),
      makeMatch({
        id: '2',
        period: '2026-11-10T10:20:00Z',
        location: 'Midtown',
        kills: 20,
        deaths: 10,
        assists: 5,
        won: true,
        activity: 'Control',
        estimatedGameMode: 'quickplay',
      }),
      makeMatch({
        id: '3',
        period: '2026-11-10T10:40:00Z',
        location: 'Burnout',
        kills: 12,
        deaths: 8,
        assists: 3,
        won: false,
        activity: 'Trials of Osiris',
        estimatedGameMode: undefined,
      }),
    ];

    const window = timeWindowToCustom('all-time', matches);

    const allModes = generateMatchSeries(matches, window, 'allGameModes');
    expect(allModes.points).toHaveLength(3);

    const trialsOnly = generateMatchSeries(matches, window, 'trials');
    expect(trialsOnly.points).toHaveLength(1);
    expect(trialsOnly.points[0].location).toBe('Javelin-4');

    const trialsMaps = generateMapTelemetry(matches, window, 'trials');
    expect(trialsMaps).toHaveLength(1);
    expect(trialsMaps[0].location).toBe('Javelin-4');
  });

  it('includes unmatched loadouts in overall series and map totals while omitting them from bestLoadout', () => {
    const snapshots: Record<string, TelemetrySnapshotSummary> = {
      'snap-hc': { id: 'snap-hc', name: 'Hand Cannon Build' },
    };

    const matches = [
      makeMatch({
        id: '1',
        period: '2026-11-10T10:00:00Z',
        location: 'Endless Vale',
        kills: 20,
        deaths: 10,
        assists: 4,
        won: true,
      }),
      makeMatch({
        id: '2',
        period: '2026-11-10T10:20:00Z',
        location: 'Endless Vale',
        kills: 14,
        deaths: 7,
        assists: 2,
        won: false,
        snapshotId: 'snap-hc',
        snapshotConfidence: 'noMatch',
      }),
      makeMatch({
        id: '3',
        period: '2026-11-10T10:40:00Z',
        location: 'Midtown',
        kills: 18,
        deaths: 9,
        assists: 5,
        won: true,
        snapshotId: 'snap-hc',
        snapshotConfidence: 'high',
      }),
      makeMatch({
        id: '4',
        period: '2026-11-10T11:00:00Z',
        location: 'Midtown',
        kills: 12,
        deaths: 12,
        assists: 4,
        won: false,
      }),
    ];

    const window = timeWindowToCustom('all-time', matches);
    const { points, summary } = generateMatchSeries(matches, window);
    expect(points).toHaveLength(4);
    expect(summary.games).toBe(4);
    expect(summary.kills).toBe(64);

    const maps = generateMapTelemetry(
      matches,
      window,
      'allGameModes',
      snapshots,
    );
    const endlessVale = maps.find((m) => m.location === 'Endless Vale');
    const midtown = maps.find((m) => m.location === 'Midtown');

    expect(endlessVale?.count).toBe(2);
    expect(endlessVale?.avgKills).toBe(17);
    expect(endlessVale?.kd).toBe(2);
    expect(endlessVale?.bestLoadout).toBeUndefined();

    expect(midtown?.count).toBe(2);
    expect(midtown?.bestLoadout).toEqual({
      snapshotId: 'snap-hc',
      name: 'Hand Cannon Build',
      kd: 2,
      winPct: 100,
      count: 1,
    });
  });

  it('converts Aggregate records to TelemetryMatch records via aggregatesToTelemetryMatches', () => {
    const aggregates: Aggregate[] = [
      {
        id: 'agg-1',
        activityId: 'act-1',
        sessionIds: ['sess-1'],
        characterIds: ['char-1'],
        snapshotIds: ['snap-1'],
        createdAt: new Date('2026-11-10T10:00:00Z'),
        activityDetails: {
          location: 'Burnout',
          activity: 'Trials of Osiris',
          description: 'Trials',
          period: new Date('2026-11-10T10:00:00Z'),
          referenceId: 1n,
          activityHash: 1n,
          activityIcon: '/icon.png',
          instanceId: 'inst-1',
          imageUrl: '/map.png',
          estimatedGameMode: 'trials',
        },
        snapshotLinks: {
          'char-1': {
            characterId: 'char-1',
            snapshotId: 'snap-1',
            confidenceLevel: 'high',
            confidenceSource: 'system',
            createdAt: new Date('2026-11-10T10:00:00Z'),
          },
        },
        performance: {
          'char-1': {
            playerStats: {
              kills: { value: 16 },
              deaths: { value: 8 },
              assists: { value: 4 },
              standing: { value: 0 },
            },
            weapons: {},
          },
        },
      },
      {
        id: 'agg-other-char',
        activityId: 'act-2',
        sessionIds: ['sess-1'],
        characterIds: ['char-2'],
        snapshotIds: [],
        createdAt: new Date('2026-11-10T10:20:00Z'),
        activityDetails: {
          location: 'Midtown',
          activity: 'Control',
          description: 'Control',
          period: new Date('2026-11-10T10:20:00Z'),
          referenceId: 2n,
          activityHash: 2n,
          activityIcon: '/icon.png',
          instanceId: 'inst-2',
          imageUrl: '/map.png',
          estimatedGameMode: 'quickplay',
        },
        snapshotLinks: {},
        performance: {},
      },
    ];

    const converted = aggregatesToTelemetryMatches(aggregates, 'char-1');
    expect(converted).toEqual([
      {
        activityId: 'act-1',
        period: new Date('2026-11-10T10:00:00Z'),
        location: 'Burnout',
        activity: 'Trials of Osiris',
        estimatedGameMode: 'trials',
        kills: 16,
        deaths: 8,
        assists: 4,
        won: true,
        snapshotId: 'snap-1',
        snapshotConfidence: 'high',
      },
    ]);
  });
});
