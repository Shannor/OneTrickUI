import { describe, expect, it, vi } from 'vitest';
import { setAuth } from '~/.server/auth';
import { login } from '~/api';

import type { Route } from './+types/oauth';
import { loader } from './oauth';

vi.mock('~/api', () => ({
  login: vi.fn(),
}));

vi.mock('~/.server/auth', () => ({
  setAuth: vi.fn((_req: Request, data: { id: string }) => {
    return new Response(null, {
      status: 302,
      headers: { Location: `/profile/${data.id}` },
    });
  }),
}));

describe('oauth loader', () => {
  it('returns error when Bungie returns an OAuth error param', async () => {
    const request = new Request(
      'http://d2onetrick.com/oauth?error=access_denied&error_description=User+cancelled',
    );
    const result = await loader({
      request,
      params: {},
      context: {},
    } as unknown as Route.LoaderArgs);

    expect(result).toEqual({ error: 'User cancelled' });
  });

  it('returns error when authorization code is missing', async () => {
    const request = new Request('http://d2onetrick.com/oauth');
    const result = await loader({
      request,
      params: {},
      context: {},
    } as unknown as Route.LoaderArgs);

    expect(result).toEqual({
      error: 'Missing authorization code from Bungie.',
    });
  });

  it('returns error when backend login API call fails', async () => {
    vi.mocked(login).mockResolvedValueOnce({
      error: { message: 'invalid_grant: AuthorizationCodeInvalid' },
      data: undefined,
      response: {
        status: 500,
        statusText: 'Internal Server Error',
      } as Response,
    } as never);

    const request = new Request(
      'http://d2onetrick.com/oauth?code=d5439663e6f6f1ff025d49d92534ed88&state=1234',
      {
        headers: {
          'user-agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
        },
      },
    );

    const result = await loader({
      request,
      params: {},
      context: {},
    } as unknown as Route.LoaderArgs);

    expect(result).toEqual({
      error: 'invalid_grant: AuthorizationCodeInvalid',
    });
    expect(login).toHaveBeenCalledWith({
      body: { code: 'd5439663e6f6f1ff025d49d92534ed88' },
    });
  });

  it('sets auth cookie and redirects on successful login', async () => {
    const mockAuthResponse = {
      id: '12345',
      token: 'jwt-token',
      expiresIn: 3600,
      timestamp: new Date().toISOString(),
      refreshToken: 'refresh-token',
    };

    vi.mocked(login).mockResolvedValueOnce({
      data: mockAuthResponse,
      error: undefined,
      response: { status: 200, statusText: 'OK' } as Response,
    } as never);

    const request = new Request(
      'http://d2onetrick.com/oauth?code=d5439663e6f6f1ff025d49d92534ed88&state=1234',
    );

    await loader({
      request,
      params: {},
      context: {},
    } as unknown as Route.LoaderArgs);

    expect(setAuth).toHaveBeenCalledWith(request, mockAuthResponse);
  });
});
