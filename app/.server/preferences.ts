import { createCookieSessionStorage } from 'react-router';
import type { Character, Profile } from '~/api';

type SessionData = {
  character?: Character;
  fireteam?: Record<string, string>;
  profile?: Omit<Profile, 'characters'>;
};

type SessionFlashData = {
  error: string;
};

const isProd = process.env.NODE_ENV === 'production';

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: '__preferences_session',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secrets: ['s3cret1'],
      secure: isProd,
    },
  });

function sanitizeValue<T>(value: T): T {
  if (!value) {
    return value;
  }
  try {
    const jsonStr = JSON.stringify(value, (_, v) =>
      typeof v === 'bigint' ? Number(v) : (v as unknown),
    );
    // SAFETY: JSON parse recreates the shape of value with BigInts converted to Numbers
    return JSON.parse(jsonStr) as T;
  } catch {
    return value;
  }
}

async function getPreferences(request: Request): Promise<SessionData> {
  const preferences = await getSession(request.headers.get('Cookie'));
  const character = preferences.get('character');
  const fireteam = preferences.get('fireteam');
  const profile = preferences.get('profile');
  return {
    character: sanitizeValue(character),
    fireteam,
    profile: sanitizeValue(profile),
  };
}

async function setPreferences(request: Request, preferences: SessionData) {
  const session = await getSession(request.headers.get('Cookie'));
  if (preferences.character) {
    session.set('character', sanitizeValue(preferences.character));
  }
  if (preferences.profile) {
    session.set('profile', sanitizeValue(preferences.profile));
  }
  if (preferences.fireteam) {
    session.set('fireteam', preferences.fireteam);
  }

  const existingChar = session.get('character');
  if (existingChar) {
    session.set('character', sanitizeValue(existingChar));
  }

  return {
    headers: {
      'Set-Cookie': await commitSession(session, {
        secure: isProd,
        sameSite: 'lax',
      }),
    },
  };
}
export { commitSession, destroySession, getPreferences, setPreferences };
