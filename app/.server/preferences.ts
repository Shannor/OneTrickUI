import { createCookieSessionStorage } from 'react-router';

type SessionData = {
  characterId?: string;
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
  return {
    characterId,
  };
}
async function setPreferences(request: Request, preferences: SessionData) {
  const session = await getSession(request.headers.get('Cookie'));
  session.set('characterId', preferences.characterId);
  return {
    headers: { 'Set-Cookie': await commitSession(session) },
  };
}
export { commitSession, destroySession, getPreferences, setPreferences };
