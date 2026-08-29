import { describe, expect, it, vi } from 'vitest';
import { getAuth } from '~/.server/auth';
import { deleteSnapshot } from '~/api';

import { action } from './delete-snapshot';

vi.mock('~/.server/auth', () => ({
  getAuth: vi.fn(),
}));

vi.mock('~/api', () => ({
  deleteSnapshot: vi.fn(),
}));

vi.mock('~/lib/logger', () => ({
  Logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('deleteSnapshot action', () => {
  it('returns error when snapshotId is missing', async () => {
    const formData = new FormData();
    const request = new Request('http://localhost/action/delete-snapshot', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as any);
    expect(result).toEqual({ error: 'No snapshot id provided' });
  });

  it('returns error when user is unauthenticated', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce(undefined);

    const formData = new FormData();
    formData.append('snapshotId', 'snap-123');
    const request = new Request('http://localhost/action/delete-snapshot', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as any);
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('prevents user from deleting another user snapshot', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-auth-1',
      accessToken: 'token-123',
      primaryMembershipId: 'mem-123',
    } as any);

    const formData = new FormData();
    formData.append('snapshotId', 'snap-123');
    formData.append('userId', 'user-other-2');
    const request = new Request('http://localhost/action/delete-snapshot', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as any);
    expect(result).toEqual({
      error: 'Forbidden: You can only delete your own loadouts',
    });
    expect(deleteSnapshot).not.toHaveBeenCalled();
  });

  it('calls deleteSnapshot API with correct headers when user is authorized', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-auth-1',
      accessToken: 'token-123',
      primaryMembershipId: 'mem-123',
    } as any);

    vi.mocked(deleteSnapshot).mockResolvedValueOnce({
      data: undefined,
      error: undefined,
    } as any);

    const formData = new FormData();
    formData.append('snapshotId', 'snap-123');
    formData.append('userId', 'user-auth-1');
    formData.append('characterId', 'char-456');

    const request = new Request('http://localhost/action/delete-snapshot', {
      method: 'POST',
      body: formData,
    });

    const response = (await action({ request } as any)) as Response;
    expect(deleteSnapshot).toHaveBeenCalledWith({
      path: { snapshotId: 'snap-123' },
      headers: {
        Authorization: 'Bearer token-123',
        'X-Membership-ID': 'mem-123',
        'X-User-ID': 'user-auth-1',
      },
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(
      '/profile/user-auth-1/c/char-456/loadouts?toast=snapshot_deleted',
    );
  });

  it('returns error when deleteSnapshot API fails', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-auth-1',
      accessToken: 'token-123',
      primaryMembershipId: 'mem-123',
    } as any);

    vi.mocked(deleteSnapshot).mockResolvedValueOnce({
      data: undefined,
      error: { message: 'Snapshot not found' },
    } as any);

    const formData = new FormData();
    formData.append('snapshotId', 'snap-123');
    formData.append('userId', 'user-auth-1');

    const request = new Request('http://localhost/action/delete-snapshot', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as any);
    expect(result).toEqual({ error: { message: 'Snapshot not found' } });
  });
});
