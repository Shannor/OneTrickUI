import { describe, expect, it } from 'vitest';
import type { MatchPoint } from '~/lib/metrics';

import {
  formatSignedDelta,
  getDefaultWindowPreset,
  slicePointsForWindow,
} from './metrics-trend-config';

const makePoints = (count: number): MatchPoint[] =>
  Array.from({ length: count }, (_, idx) => ({
    matchIndex: idx + 1,
    activityId: `act-${idx + 1}`,
    time: '2026-11-01T12:00:00Z',
    shortLabel: `#${idx + 1}`,
    fullLabel: `Match #${idx + 1}`,
    location: 'Eternity',
    kills: 15,
    deaths: 10,
    assists: 5,
    won: true,
    kd: 1.5,
    kda: 2.0,
    winPct: 100,
    rollingKd: 1.5,
    rollingKda: 2.0,
    rollingWinPct: 100,
    rollingKills: 15,
    rollingDeaths: 10,
    rollingAssists: 5,
    kdBand: [1.5, 1.5],
    kdaBand: [2.0, 2.0],
    killsBand: [15, 15],
  }));

describe('metrics-trend-config helpers', () => {
  it('selects default window presets based on match volume and hideKpiTabs', () => {
    expect(getDefaultWindowPreset(20, false)).toBe('all');
    expect(getDefaultWindowPreset(60, false)).toBe('summary');
    expect(getDefaultWindowPreset(60, true)).toBe('25');
  });

  it('formats signed deltas and returns null for zero or null values', () => {
    expect(formatSignedDelta(0.25)).toBe('+0.25');
    expect(formatSignedDelta(-0.4)).toBe('-0.4');
    expect(formatSignedDelta(8, '%')).toBe('+8%');
    expect(formatSignedDelta(0)).toBeNull();
    expect(formatSignedDelta(null)).toBeNull();
  });

  it('slices match points according to windowPreset', () => {
    const points = makePoints(30);
    expect(slicePointsForWindow(points, 'summary')).toHaveLength(0);
    expect(slicePointsForWindow(points, '10')).toHaveLength(10);
    expect(slicePointsForWindow(points, '10')[0].matchIndex).toBe(21);
    expect(slicePointsForWindow(points, '25')).toHaveLength(25);
    expect(slicePointsForWindow(points, 'all')).toHaveLength(30);
  });
});
