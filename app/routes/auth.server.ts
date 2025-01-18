import { createCookieSessionStorage } from 'react-router';
import type { AuthResponse } from '~/api';

type SessionData = {
  jwt: AuthResponse;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: '__auth_session',
      httpOnly: true,
      maxAge: 60,
      path: '/',
      sameSite: 'lax',
      secrets: ['s3cret1'],
      secure: true,
    },
  });

export { getSession, commitSession, destroySession };
