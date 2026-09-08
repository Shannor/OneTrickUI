import { describe, expect, it, vi } from 'vitest';
import { getAuth } from '~/.server/auth';
import { startSession } from '~/api';

import { action } from './start-session';

vi.mock('~/.server/auth', () => ({
  getAuth: vi.fn(),
}));

vi.mock('~/api', () => ({
  startSession: vi.fn(),
}));

vi.mock('~/lib/logger', () => ({
  Logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('start-session action', () => {
  it('returns error when characterId is missing', async () => {
    const formData = new FormData();
    formData.append('userId', 'user-123');
    const request = new Request('http://localhost/action/start-session', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as never);
    expect(result).toEqual({ error: 'No character id' });
  });

  it('returns error when userId is missing', async () => {
    const formData = new FormData();
    formData.append('characterId', 'char-456');
    const request = new Request('http://localhost/action/start-session', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as never);
    expect(result).toEqual({ error: 'No user id' });
  });

  it('returns error when user is unauthenticated', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce(undefined);

    const formData = new FormData();
    formData.append('characterId', 'char-456');
    formData.append('userId', 'user-123');
    const request = new Request('http://localhost/action/start-session', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as never);
    expect(result).toEqual({ error: 'No auth token' });
  });

  it('returns error when startSession API returns an error', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-123',
      accessToken: 'token-abc',
      primaryMembershipId: 'mem-789',
    } as never);

    vi.mocked(startSession).mockResolvedValueOnce({
      data: undefined,
      error: { message: 'Internal Server Error' },
    } as never);

    const formData = new FormData();
    formData.append('characterId', 'char-456');
    formData.append('userId', 'user-123');
    const request = new Request('http://localhost/action/start-session', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as never);
    expect(result).toEqual({ error: { message: 'Internal Server Error' } });
  });

  it('returns error when startSession returns no data', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-123',
      accessToken: 'token-abc',
      primaryMembershipId: 'mem-789',
    } as never);

    vi.mocked(startSession).mockResolvedValueOnce({
      data: undefined,
      error: undefined,
    } as never);

    const formData = new FormData();
    formData.append('characterId', 'char-456');
    formData.append('userId', 'user-123');
    const request = new Request('http://localhost/action/start-session', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as never);
    expect(result).toEqual({ error: 'No data' });
  });

  it('starts session and redirects to the new session page', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-123',
      accessToken: 'token-abc',
      primaryMembershipId: 'mem-789',
    } as never);

    vi.mocked(startSession).mockResolvedValueOnce({
      data: {
        id: 'sess-created-999',
        userId: 'user-123',
        characterId: 'char-456',
      },
      error: undefined,
    } as never);

    const formData = new FormData();
    formData.append('characterId', 'char-456');
    formData.append('userId', 'user-123');
    const request = new Request('http://localhost/action/start-session', {
      method: 'POST',
      body: formData,
    });

    const response = (await action({ request } as never)) as Response;

    expect(startSession).toHaveBeenCalledWith({
      body: {
        characterId: 'char-456',
        userId: 'user-123',
      },
      headers: {
        Authorization: 'Bearer token-abc',
        'X-Membership-ID': 'mem-789',
        'X-User-ID': 'user-123',
      },
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(
      '/profile/user-123/c/char-456/sessions/sess-created-999',
    );
  });

  it('redirects to redirectTo when provided in form data', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-123',
      accessToken: 'token-abc',
      primaryMembershipId: 'mem-789',
    } as never);

    vi.mocked(startSession).mockResolvedValueOnce({
      data: {
        id: 'sess-created-999',
        userId: 'user-123',
        characterId: 'char-456',
      },
      error: undefined,
    } as never);

    const formData = new FormData();
    formData.append('characterId', 'char-456');
    formData.append('userId', 'user-123');
    formData.append('redirectTo', '/custom/destination');
    const request = new Request('http://localhost/action/start-session', {
      method: 'POST',
      body: formData,
    });

    const response = (await action({ request } as never)) as Response;

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/custom/destination');
  });
});
