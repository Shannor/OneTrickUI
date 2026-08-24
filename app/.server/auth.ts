import { createCookieSessionStorage, redirect } from 'react-router';
import { type AuthResponse, refreshToken } from '~/api';

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
    const { data: jwt } = await refreshToken({
      body: {
        code: auth.refreshToken.toString(),
      },
    });
    // TODO: If we fail to refresh then we need to clear the cookie and send it to login
    return jwt;
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
  const session = await getSession(request.headers.get('Cookie'));
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
