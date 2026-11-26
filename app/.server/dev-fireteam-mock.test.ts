import { describe, expect, it } from 'vitest';

import {
  buildDevMockBulkStartResults,
  getDevMockFireteamMembers,
  handleDevMockBulkStart,
  parseDevFireteamMockScenario,
} from './dev-fireteam-mock';

describe('dev-fireteam-mock', () => {
  it('parses valid scenario names and aliases', () => {
    expect(parseDevFireteamMockScenario('1')).toBe('mixed');
    expect(parseDevFireteamMockScenario('mixed')).toBe('mixed');
    expect(parseDevFireteamMockScenario('race')).toBe('race');
    expect(parseDevFireteamMockScenario('all-active')).toBe('all-active');
    expect(parseDevFireteamMockScenario('all-inactive')).toBe('all-inactive');
    expect(parseDevFireteamMockScenario('invalid')).toBeUndefined();
    expect(parseDevFireteamMockScenario(null)).toBeUndefined();
  });

  it('builds mixed scenario with 1 active member and 2 inactive members', () => {
    const members = getDevMockFireteamMembers('mixed');
    expect(members).toHaveLength(3);
    expect(members[0].activeSessions).toHaveLength(1);
    expect(members[0].activeSessions?.[0].startedAt).toBeInstanceOf(Date);
    expect(members[1].activeSessions).toBeUndefined();
    expect(members[2].activeSessions).toBeUndefined();
  });

  it('simulates mixed skipped_active and started outcomes in race scenario', () => {
    const results = buildDevMockBulkStartResults(
      'race',
      [
        { userId: 'PKmxjnMbBeDkGyzp2ICa', characterId: '2305843009319907556' },
        { userId: 'zUk4BWzsezGpYAs0TIzY', characterId: '2305843009277090551' },
      ],
      true,
    );

    expect(results).toHaveLength(2);
    expect(results[0].outcome).toBe('skipped_active');
    expect(results[0].session.name).toBe('Already Running Session');
    expect(results[0].session.startedAt).toBeInstanceOf(Date);
    expect(results[1].outcome).toBe('started');
    expect(results[1].session.name).toBe('Comp Fireteam Grind');
    expect(results[1].session.compTracking?.enabled).toBe(true);
  });

  it('handles bulk start mock formData only when a valid mockScenario is present', () => {
    const members = [{ userId: 'u1', characterId: 'c1' }];
    const emptyForm = new FormData();
    expect(handleDevMockBulkStart(emptyForm, members, false)).toBeUndefined();

    const mockForm = new FormData();
    mockForm.append('mockScenario', 'mixed');
    const results = handleDevMockBulkStart(mockForm, members, false);
    expect(results).toHaveLength(1);
    expect(results?.[0].session.name).toBe('Crucible Fireteam Session');
  });
});
