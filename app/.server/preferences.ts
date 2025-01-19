import { createCookieSessionStorage } from 'react-router';
import type { AuthResponse } from '~/api';

type SessionData = {
  characterId: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: '__preferences_session',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secrets: ['s3cret1'],
      secure: true,
    },
  });

export {
  getSession as getPreferences,
  commitSession as commitPreferences,
  destroySession,
};
