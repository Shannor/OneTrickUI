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

async function getPreferences(request: Request): Promise<SessionData> {
  const preferences = await getSession(request.headers.get('Cookie'));
  const character = preferences.get('character');
  const fireteam = preferences.get('fireteam');
  const profile = preferences.get('profile');
  return {
    character,
    fireteam,
    profile,
  };
}

async function setPreferences(request: Request, preferences: SessionData) {
  const session = await getSession(request.headers.get('Cookie'));
  if (preferences.character) {
    session.set('character', preferences.character);
  }
  if (preferences.profile) {
    session.set('profile', preferences.profile);
  }
  if (preferences.fireteam) {
    session.set('fireteam', preferences.fireteam);
  }
  return {
    headers: { 'Set-Cookie': await commitSession(session) },
  };
}
export { commitSession, destroySession, getPreferences, setPreferences };
