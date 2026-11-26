import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuth } from '~/.server/auth';
import { getPreferences, setPreferences } from '~/.server/preferences';
import { startFireteamSessions } from '~/api';

import {
  MAX_FIRETEAM_SESSION_MEMBERS,
  action,
} from './start-fireteam-sessions';

vi.mock('~/.server/auth', () => ({
  getAuth: vi.fn(),
}));

vi.mock('~/.server/preferences', () => ({
  getPreferences: vi.fn(),
  setPreferences: vi.fn(),
}));

vi.mock('~/api', () => ({
  startFireteamSessions: vi.fn(),
}));

describe('start-fireteam-sessions action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPreferences).mockResolvedValue({ fireteam: {} });
    vi.mocked(setPreferences).mockResolvedValue({
      headers: { 'Set-Cookie': 'prefs=ok' },
    });
  });

  it('returns an error when no members are provided', async () => {
    const formData = new FormData();
    formData.append('members', '[]');
    const request = new Request(
      'http://localhost/action/start-fireteam-sessions',
      {
        method: 'POST',
        body: formData,
      },
    );

    const result = await action({ request } as never);
    expect(result).toEqual({
      ok: false,
      error: 'Select at least one fireteam member to start.',
    });
    expect(startFireteamSessions).not.toHaveBeenCalled();
  });

  it('returns an error when member count exceeds MAX_FIRETEAM_SESSION_MEMBERS', async () => {
    const tooManyMembers = Array.from(
      { length: MAX_FIRETEAM_SESSION_MEMBERS + 1 },
      (_, index) => ({
        userId: `user-${index}`,
        characterId: `char-${index}`,
      }),
    );

    const formData = new FormData();
    formData.append('members', JSON.stringify(tooManyMembers));
    const request = new Request(
      'http://localhost/action/start-fireteam-sessions',
      {
        method: 'POST',
        body: formData,
      },
    );

    const result = await action({ request } as never);
    expect(result).toEqual({
      ok: false,
      error: `You can start sessions for at most ${MAX_FIRETEAM_SESSION_MEMBERS} fireteam members at once.`,
    });
    expect(startFireteamSessions).not.toHaveBeenCalled();
  });

  it('returns an error when unauthenticated', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce(undefined);

    const formData = new FormData();
    formData.append(
      'members',
      JSON.stringify([{ userId: 'u1', characterId: 'c1' }]),
    );
    const request = new Request(
      'http://localhost/action/start-fireteam-sessions',
      {
        method: 'POST',
        body: formData,
      },
    );

    const result = await action({ request } as never);
    expect(result).toEqual({ ok: false, error: 'No auth token' });
    expect(startFireteamSessions).not.toHaveBeenCalled();
  });

  it('returns API error message when POST /fireteam/sessions fails', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-1',
      accessToken: 'token-abc',
      primaryMembershipId: 'mem-1',
    } as never);

    vi.mocked(startFireteamSessions).mockResolvedValueOnce({
      data: undefined,
      error: { message: 'Target user is not in your current fireteam' },
    } as never);

    const formData = new FormData();
    formData.append(
      'members',
      JSON.stringify([{ userId: 'user-2', characterId: 'char-2' }]),
    );
    const request = new Request(
      'http://localhost/action/start-fireteam-sessions',
      {
        method: 'POST',
        body: formData,
      },
    );

    const result = await action({ request } as never);
    expect(result).toEqual({
      ok: false,
      error: 'Target user is not in your current fireteam',
    });
  });

  it('calls POST /fireteam/sessions once with deduplicated members and returns backend results directly', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-1',
      accessToken: 'token-abc',
      primaryMembershipId: 'mem-1',
    } as never);

    vi.mocked(getPreferences).mockResolvedValueOnce({
      fireteam: { 'user-0': 'char-0' },
    });

    const startedAt = new Date('2026-11-25T00:00:00.000Z');
    const backendResults = [
      {
        userId: 'user-1',
        characterId: 'char-1',
        outcome: 'skipped_active' as const,
        session: {
          id: 'sess-existing',
          userId: 'user-1',
          characterId: 'char-1',
          startedAt,
          status: 'pending' as const,
          name: 'Existing Comp Session',
          aggregateIds: ['g1'],
        },
      },
      {
        userId: 'user-2',
        characterId: 'char-2',
        outcome: 'started' as const,
        session: {
          id: 'sess-new-2',
          userId: 'user-2',
          characterId: 'char-2',
          startedAt,
          status: 'pending' as const,
          aggregateIds: [],
          compTracking: { enabled: true },
        },
      },
      {
        userId: 'user-3',
        characterId: 'char-3',
        outcome: 'started' as const,
        session: {
          id: 'sess-new-3',
          userId: 'user-3',
          characterId: 'char-3',
          startedAt,
          status: 'pending' as const,
          aggregateIds: [],
          compTracking: { enabled: true },
        },
      },
    ];

    vi.mocked(startFireteamSessions).mockResolvedValueOnce({
      data: {
        results: backendResults,
      },
      error: undefined,
    } as never);

    const formData = new FormData();
    formData.append(
      'members',
      JSON.stringify([
        { userId: 'user-1', characterId: 'char-1' },
        { userId: 'user-2', characterId: 'char-2' },
        { userId: 'user-2', characterId: 'char-2' },
        { userId: 'user-3', characterId: 'char-3' },
      ]),
    );
    formData.append('trackComp', 'true');

    const request = new Request(
      'http://localhost/action/start-fireteam-sessions',
      {
        method: 'POST',
        body: formData,
      },
    );

    const result = (await action({ request } as never)) as {
      data: { ok: boolean; results: unknown[] };
      init?: { headers?: Record<string, string> };
    };

    expect(startFireteamSessions).toHaveBeenCalledTimes(1);
    expect(startFireteamSessions).toHaveBeenCalledWith({
      body: {
        members: [
          { userId: 'user-1', characterId: 'char-1' },
          { userId: 'user-2', characterId: 'char-2' },
          { userId: 'user-3', characterId: 'char-3' },
        ],
        trackComp: true,
      },
      headers: {
        Authorization: 'Bearer token-abc',
        'X-Membership-ID': 'mem-1',
        'X-User-ID': 'user-1',
      },
    });

    expect(setPreferences).toHaveBeenCalledWith(request, {
      fireteam: {
        'user-0': 'char-0',
        'user-1': 'char-1',
        'user-2': 'char-2',
        'user-3': 'char-3',
      },
    });

    expect(result.data).toEqual({
      ok: true,
      results: backendResults,
    });
  });
});
