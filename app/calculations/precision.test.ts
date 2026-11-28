import { describe, expect, it } from 'vitest';
import type { PlayerStats } from '~/api';

import {
  calculatePercentage,
  calculateRatio,
  computePlayerCombatStats,
} from './precision';

describe('precision helpers', () => {
  it('computes ratios and percentages safely with zero denominators', () => {
    expect(calculateRatio(12, 6)).toBe(2);
    expect(calculateRatio(8, 0)).toBe(8);
    expect(calculateRatio(0, 5)).toBe(0);
    expect(calculatePercentage(3, 4)).toBe(75);
    expect(calculatePercentage(0, 4)).toBe(0);
  });

  it('computes player combat stats from PlayerStats', () => {
    const stats = {
      kills: { value: 12 },
      assists: { value: 4 },
      deaths: { value: 6 },
    } as PlayerStats;

    const result = computePlayerCombatStats(stats);
    expect(result.kills).toBe(12);
    expect(result.assists).toBe(4);
    expect(result.deaths).toBe(6);
    expect(result.kd).toBe(2);
    expect(result.efficiency).toBeCloseTo(2.6667, 4);
  });

  it('handles zero deaths and missing PlayerStats safely', () => {
    const flawless = computePlayerCombatStats({
      kills: { value: 10 },
      assists: { value: 5 },
      deaths: { value: 0 },
    } as PlayerStats);
    expect(flawless).toEqual({
      kills: 10,
      assists: 5,
      deaths: 0,
      kd: 10,
      efficiency: 15,
    });

    expect(computePlayerCombatStats(undefined)).toEqual({
      kills: 0,
      assists: 0,
      deaths: 0,
      kd: 0,
      efficiency: 0,
    });
  });
});
