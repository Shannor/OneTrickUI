import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuth } from '~/.server/auth';
import { mergeSnapshots } from '~/api';

import { action, clientAction } from './merge-loadout';

vi.mock('~/.server/auth', () => ({
  getAuth: vi.fn(),
}));

vi.mock('~/api', () => ({
  mergeSnapshots: vi.fn(),
}));

describe('merge-loadout action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { ok: false, error } when unauthenticated', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce(undefined);

    const formData = new FormData();
    formData.append('baseLoadoutId', 'target-1');
    formData.append('targetLoadoutId', 'source-1');

    const request = new Request('http://localhost/action/merge-loadout', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, context: new Map() } as any);
    expect(result).toEqual({ ok: false, error: 'No auth token' });
  });

  it('supports single sourceSnapshotId / targetLoadoutId', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-1',
      accessToken: 'token-abc',
    } as any);
    vi.mocked(mergeSnapshots).mockResolvedValueOnce({
      data: true,
      error: undefined,
    } as any);

    const formData = new FormData();
    formData.append('baseLoadoutId', 'target-1');
    formData.append('targetLoadoutId', 'source-1');

    const request = new Request('http://localhost/action/merge-loadout', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, context: new Map() } as any);
    expect(result).toEqual({ ok: true });
    expect(mergeSnapshots).toHaveBeenCalledWith({
      path: { snapshotId: 'target-1' },
      body: { sourceSnapshotIds: ['source-1'] },
      headers: {
        Authorization: 'Bearer token-abc',
        'X-User-ID': 'user-1',
      },
    });
  });

  it('supports batch sourceSnapshotIds and strips accidental self-merge IDs', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-1',
      accessToken: 'token-abc',
    } as any);
    vi.mocked(mergeSnapshots).mockResolvedValueOnce({
      data: true,
      error: undefined,
    } as any);

    const formData = new FormData();
    formData.append('baseLoadoutId', 'target-1');
    formData.append('sourceSnapshotIds', 'target-1');
    formData.append('sourceSnapshotIds', 'source-1');
    formData.append('sourceSnapshotIds', 'source-2');

    const request = new Request('http://localhost/action/merge-loadout', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, context: new Map() } as any);
    expect(result).toEqual({ ok: true });
    expect(mergeSnapshots).toHaveBeenCalledWith({
      path: { snapshotId: 'target-1' },
      body: { sourceSnapshotIds: ['source-1', 'source-2'] },
      headers: {
        Authorization: 'Bearer token-abc',
        'X-User-ID': 'user-1',
      },
    });
  });

  it('returns { ok: false, error } when mergeSnapshots API returns an error', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-1',
      accessToken: 'token-abc',
    } as any);
    vi.mocked(mergeSnapshots).mockResolvedValueOnce({
      data: undefined,
      error: { message: 'Snapshots are incompatible for merge' },
    } as any);

    const formData = new FormData();
    formData.append('baseLoadoutId', 'target-1');
    formData.append('targetLoadoutId', 'source-bad');

    const request = new Request('http://localhost/action/merge-loadout', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, context: new Map() } as any);
    expect(result).toEqual({
      ok: false,
      error: 'Snapshots are incompatible for merge',
    });
  });

  it('catches thrown backend/network exceptions without crashing the route', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-1',
      accessToken: 'token-abc',
    } as any);
    vi.mocked(mergeSnapshots).mockRejectedValueOnce(
      new Error('connect ECONNREFUSED 127.0.0.1:8080'),
    );

    const formData = new FormData();
    formData.append('baseLoadoutId', 'target-1');
    formData.append('sourceSnapshotIds', 'source-1');

    const request = new Request('http://localhost/action/merge-loadout', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, context: new Map() } as any);
    expect(result).toEqual({
      ok: false,
      error: 'connect ECONNREFUSED 127.0.0.1:8080',
    });
  });

  it('clientAction catches Failed to fetch errors instead of bubbling to root ErrorBoundary', async () => {
    const result = await clientAction({
      serverAction: () => Promise.reject(new TypeError('Failed to fetch')),
    } as any);

    expect(result).toEqual({
      ok: false,
      error:
        'Network error while merging loadouts. Please check your connection and try again.',
    });
  });
});
