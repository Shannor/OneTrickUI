import { createCookieSessionStorage, redirect } from 'react-router';
import { getRequestLogger } from '~/.server/logger';
import { type AuthResponse, refreshToken } from '~/api';
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
  const log = getRequestLogger();
  const session = await getSession(request.headers.get('Cookie'));
  const auth = session.get('jwt');
  if (!auth) {
    return undefined;
  }
  const expiresMillisecond = auth.expiresIn * 1000;
  const givenTime = new Date(auth.timestamp).getTime();
  if (Date.now() >= givenTime + expiresMillisecond) {
    log.set({
      fn: 'getAuth',
      auth: { flow: 'auth_refresh', userId: auth.id },
    });
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
        log.error('Failed to refresh expired auth token', {
          auth: {
            flow: 'auth_refresh',
            userId: auth.id,
            backendStatus: response?.status,
            backendStatusText: response?.statusText,
            refreshErr,
          },
        });
        return undefined;
      }
      log.set({ auth: { refreshed: true } });
      return jwt;
    } catch (e) {
      log.error(e instanceof Error ? e : String(e), {
        auth: { flow: 'auth_refresh', userId: auth.id },
      });
      return undefined;
    }
  }
  return auth;
}

async function refreshHeaders(request: Request, auth: AuthResponse) {
  const log = getRequestLogger();
  log.set({
    fn: 'refreshHeaders',
    auth: { userId: auth.id },
  });
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
  const log = getRequestLogger();
  log.set({
    fn: 'logout',
    auth: { flow: 'logout', userId: auth?.id },
    requestMeta: meta,
  });
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
  const log = getRequestLogger();
  log.set({
    fn: 'setAuth',
    auth: { flow: 'set_auth', userId: auth.id },
    requestMeta: meta,
  });
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
  const referer = request.headers.get('Referer');
  if (referer) {
    try {
      const requestUrl = new URL(request.url);
      const refererUrl = new URL(referer, requestUrl.origin);
      if (refererUrl.origin === requestUrl.origin) {
        return redirect(refererUrl.pathname + refererUrl.search, response);
      }
    } catch {
      // Ignore URL parsing errors and fallback
    }
  }
  return redirect(fallback, response);
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
