import { describe, expect, it, vi } from 'vitest';
import { getAuth } from '~/.server/auth';
import { deleteSession } from '~/api';

import { action } from './delete-session';

vi.mock('~/.server/auth', () => ({
  getAuth: vi.fn(),
}));

vi.mock('~/api', () => ({
  deleteSession: vi.fn(),
}));

vi.mock('~/lib/logger', () => ({
  Logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('deleteSession action', () => {
  it('returns error when sessionId is missing', async () => {
    const formData = new FormData();
    const request = new Request('http://localhost/action/delete-session', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as any);
    expect(result).toEqual({ error: 'No session id provided' });
  });

  it('returns error when user is unauthenticated', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce(undefined);

    const formData = new FormData();
    formData.append('sessionId', 'sess-123');
    const request = new Request('http://localhost/action/delete-session', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as any);
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('prevents user from deleting another user session', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-auth-1',
      accessToken: 'token-123',
      primaryMembershipId: 'mem-123',
    } as any);

    const formData = new FormData();
    formData.append('sessionId', 'sess-123');
    formData.append('userId', 'user-other-2'); // Different user ID!
    const request = new Request('http://localhost/action/delete-session', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as any);
    expect(result).toEqual({
      error: 'Forbidden: You can only delete your own sessions',
    });
    expect(deleteSession).not.toHaveBeenCalled();
  });

  it('calls deleteSession API with correct headers when user is authorized', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-auth-1',
      accessToken: 'token-123',
      primaryMembershipId: 'mem-123',
    } as any);

    vi.mocked(deleteSession).mockResolvedValueOnce({
      data: undefined,
      error: undefined,
    } as any);

    const formData = new FormData();
    formData.append('sessionId', 'sess-123');
    formData.append('userId', 'user-auth-1');
    formData.append('characterId', 'char-456');

    const request = new Request('http://localhost/action/delete-session', {
      method: 'POST',
      body: formData,
    });

    const response = (await action({ request } as any)) as Response;
    expect(deleteSession).toHaveBeenCalledWith({
      path: { sessionId: 'sess-123' },
      headers: {
        Authorization: 'Bearer token-123',
        'X-Membership-ID': 'mem-123',
        'X-User-ID': 'user-auth-1',
      },
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(
      '/profile/user-auth-1/c/char-456/sessions?toast=session_deleted',
    );
  });

  it('returns error when deleteSession API fails', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-auth-1',
      accessToken: 'token-123',
      primaryMembershipId: 'mem-123',
    } as any);

    vi.mocked(deleteSession).mockResolvedValueOnce({
      data: undefined,
      error: { message: 'Session not found' },
    } as any);

    const formData = new FormData();
    formData.append('sessionId', 'sess-123');
    formData.append('userId', 'user-auth-1');

    const request = new Request('http://localhost/action/delete-session', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as any);
    expect(result).toEqual({ error: { message: 'Session not found' } });
  });
});
