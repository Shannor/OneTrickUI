import { createCookieSessionStorage, redirect } from 'react-router';
import { type AuthResponse, refreshToken } from '~/api';
import { Logger } from '~/lib/logger';
import { extractRequestMeta } from '~/lib/request-logger';

type SessionData = {
  jwt: AuthResponse;
};

type SessionFlashData = {
  error: string;
};

const isProd = process.env.NODE_ENV === 'production';

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: '__auth_session',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secrets: ['s3cret1'],
      secure: isProd,
    },
  });

async function getAuth(request: Request): Promise<AuthResponse | undefined> {
  const session = await getSession(request.headers.get('Cookie'));
  const auth = session.get('jwt');
  if (!auth) {
    return undefined;
  }
  const expiresMillisecond = auth.expiresIn * 1000;
  const givenTime = new Date(auth.timestamp).getTime();
  if (Date.now() >= givenTime + expiresMillisecond) {
    const l = Logger.child({ flow: 'auth_refresh', userId: auth.id });
    l.info('Auth session token expired, attempting to refresh token');
    try {
      const {
        data: jwt,
        error: refreshErr,
        response,
      } = await refreshToken({
        body: {
          code: auth.refreshToken.toString(),
        },
      });
      if (refreshErr || !jwt) {
        l.error(
          {
            refreshErr,
            backendStatus: response?.status,
            backendStatusText: response?.statusText,
          },
          'Failed to refresh expired auth token',
        );
        return undefined;
      }
      l.info('Auth session token refreshed successfully');
      return jwt;
    } catch (e) {
      l.error({ err: e }, 'Exception encountered while refreshing auth token');
      return undefined;
    }
  }
  return auth;
}

async function refreshHeaders(request: Request, auth: AuthResponse) {
  const session = await getSession(request.headers.get('Cookie'));
  session.set('jwt', auth);
  return {
    headers: {
      'Set-Cookie': await commitSession(session, {
        secure: isProd,
        sameSite: 'lax',
      }),
    },
  };
}

async function logout(request: Request) {
  const meta = extractRequestMeta(request);
  const session = await getSession(request.headers.get('Cookie'));
  const auth = session.get('jwt');
  const l = Logger.child({ flow: 'logout', ...meta, userId: auth?.id });
  l.info('Destroying session cookie and redirecting to home page');
  return redirect('/', {
    headers: {
      'Set-Cookie': await destroySession(session, {
        secure: isProd,
        sameSite: 'lax',
      }),
    },
  });
}

async function setAuth(request: Request, auth: AuthResponse) {
  const meta = extractRequestMeta(request);
  const l = Logger.child({ flow: 'set_auth', ...meta, userId: auth.id });
  l.info('Committing session cookie and redirecting user to profile page');
  const session = await getSession(request.headers.get('Cookie'));
  session.set('jwt', auth);
  return redirect(`/profile/${auth.id}`, {
    headers: {
      'Set-Cookie': await commitSession(session, {
        secure: isProd,
        sameSite: 'lax',
      }),
    },
  });
}

function redirectBack(
  request: Request,
  { fallback, response }: { fallback: string; response?: ResponseInit },
) {
  return redirect(request.headers.get('Referer') ?? fallback, response);
}

export {
  getSession,
  commitSession,
  destroySession,
  getAuth,
  refreshHeaders,
  setAuth,
  logout,
  redirectBack,
};
