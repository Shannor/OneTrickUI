import { type Session, createCookieSessionStorage } from 'react-router';

type SessionData = {
  characterId?: string;
  fireteam?: Record<string, string>;
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
  const characterId = preferences.get('characterId');
  const fireteam = preferences.get('fireteam');
  return {
    characterId,
    fireteam,
  };
}

async function getPreferenceSession(
  request: Request,
): Promise<Session<SessionData, SessionFlashData>> {
  return await getSession(request.headers.get('Cookie'));
}

async function setPreferences(request: Request, preferences: SessionData) {
  const session = await getSession(request.headers.get('Cookie'));
  if (preferences.characterId) {
    session.set('characterId', preferences.characterId);
  }
  if (preferences.fireteam) {
    const existing = session.get('fireteam');
    if (existing) {
      session.set('fireteam', { ...existing, ...preferences.fireteam });
    } else {
      session.set('fireteam', preferences.fireteam);
    }
  }
  return {
    headers: { 'Set-Cookie': await commitSession(session) },
  };
}
export {
  commitSession,
  destroySession,
  getPreferences,
  getPreferenceSession,
  setPreferences,
};
