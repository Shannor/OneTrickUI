import { describe, expect, it, vi } from 'vitest';
import { getUser } from '~/api';

import { getCachedUser, redirectBack } from './auth';

vi.mock('~/api', () => ({
  getUser: vi.fn(),
  refreshToken: vi.fn(),
}));

describe('redirectBack', () => {
  it('redirects to fallback when Referer header is missing', () => {
    const request = new Request('http://localhost:5173/action/test', {
      method: 'POST',
    });

    const response = redirectBack(request, { fallback: '/fallback-path' });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/fallback-path');
  });

  it('redirects to referer path when Referer header is present and same origin', () => {
    const request = new Request('http://localhost:5173/action/test', {
      method: 'POST',
      headers: {
        Referer: 'http://localhost:5173/profile/123/c/456/sessions?page=2',
      },
    });

    const response = redirectBack(request, { fallback: '/' });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(
      '/profile/123/c/456/sessions?page=2',
    );
  });

  it('redirects to fallback when Referer has a different origin', () => {
    const request = new Request('http://localhost:5173/action/test', {
      method: 'POST',
      headers: {
        Referer: 'https://evil.com/phishing',
      },
    });

    const response = redirectBack(request, { fallback: '/safe-fallback' });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/safe-fallback');
  });

  it('passes additional response options like custom headers', () => {
    const request = new Request('http://localhost:5173/action/test', {
      method: 'POST',
      headers: {
        Referer: 'http://localhost:5173/profile/123',
      },
    });

    const response = redirectBack(request, {
      fallback: '/',
      response: {
        headers: {
          'Set-Cookie': 'test=value',
        },
      },
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/profile/123');
    expect(response.headers.get('Set-Cookie')).toBe('test=value');
  });

  it('redirects to referer path behind a reverse proxy where schemes differ but host matches', () => {
    const request = new Request('http://d2onetrick.com/action/end-session', {
      method: 'POST',
      headers: {
        Referer: 'https://d2onetrick.com/profile/123/c/456/sessions/789',
      },
    });

    const response = redirectBack(request, { fallback: '/' });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(
      '/profile/123/c/456/sessions/789',
    );
  });
});

describe('getCachedUser', () => {
  it('deduplicates concurrent getUser calls for the same Request and userId', async () => {
    vi.mocked(getUser).mockResolvedValue({
      data: { id: 'u1', displayName: 'Guardian' },
      error: undefined,
    } as never);

    const request = new Request('https://d2onetrick.com/profile/u1');
    const [res1, res2] = await Promise.all([
      getCachedUser(request, 'u1'),
      getCachedUser(request, 'u1'),
    ]);

    expect(res1).toEqual(res2);
    expect(getUser).toHaveBeenCalledTimes(1);
  });
});
