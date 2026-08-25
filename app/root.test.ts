import { describe, expect, it, vi } from 'vitest';
import { getAuth } from '~/.server/auth';
import { getUser } from '~/api';

import type { Route } from './+types/root';
import { loader } from './root';

vi.hoisted(() => {
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
});

vi.mock('~/.server/sessions', () => ({
  themeSessionResolver: vi.fn(async () => ({
    getTheme: () => 'dark',
  })),
}));

vi.mock('~/.server/auth', () => ({
  getAuth: vi.fn(),
}));

vi.mock('~/api', () => ({
  getUser: vi.fn(),
}));

vi.mock('~/lib/logger', () => ({
  Logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('root loader', () => {
  it('returns user as null when signed out', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce(undefined);

    const request = new Request('http://d2onetrick.com/');
    const result = await loader({
      request,
      params: {},
      context: {},
    } as unknown as Route.LoaderArgs);

    expect(result).toEqual({
      theme: 'dark',
      user: null,
    });
  });

  it('returns user with profile data when signed in and getUser succeeds', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-123',
      membershipId: 'mem-456',
      primaryMembershipId: 'prim-789',
      accessToken: 'token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      refreshToken: 'refresh',
      refreshExpiresIn: 7200,
      timestamp: new Date(),
    });

    vi.mocked(getUser).mockResolvedValueOnce({
      data: {
        id: 'user-123',
        displayName: 'Guardian#1234',
        uniqueName: 'Guardian#1234',
        membershipId: 'mem-456',
        characters: [],
      },
      error: undefined,
      response: { status: 200 } as Response,
    } as never);

    const request = new Request('http://d2onetrick.com/');
    const result = await loader({
      request,
      params: {},
      context: {},
    } as unknown as Route.LoaderArgs);

    expect(result).toEqual({
      theme: 'dark',
      user: {
        id: 'user-123',
        membershipId: 'mem-456',
        primaryMembershipId: 'prim-789',
        name: 'Guardian#1234',
        displayName: 'Guardian#1234',
        uniqueName: 'Guardian#1234',
        characters: [],
      },
    });
  });

  it('falls back to auth session user if getUser fails or throws', async () => {
    vi.mocked(getAuth).mockResolvedValueOnce({
      id: 'user-123',
      membershipId: 'mem-456',
      primaryMembershipId: 'prim-789',
      accessToken: 'token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      refreshToken: 'refresh',
      refreshExpiresIn: 7200,
      timestamp: new Date(),
    });

    vi.mocked(getUser).mockRejectedValueOnce(new Error('Network error'));

    const request = new Request('http://d2onetrick.com/');
    const result = await loader({
      request,
      params: {},
      context: {},
    } as unknown as Route.LoaderArgs);

    expect(result).toEqual({
      theme: 'dark',
      user: {
        id: 'user-123',
        membershipId: 'mem-456',
        primaryMembershipId: 'prim-789',
      },
    });
  });

  it('returns user as null safely if getAuth throws an exception (malformed session)', async () => {
    vi.mocked(getAuth).mockRejectedValueOnce(
      new Error('Corrupted cookie session'),
    );

    const request = new Request('http://d2onetrick.com/');
    const result = await loader({
      request,
      params: {},
      context: {},
    } as unknown as Route.LoaderArgs);

    expect(result).toEqual({
      theme: 'dark',
      user: null,
    });
  });
});
