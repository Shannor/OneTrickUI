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

async function getAuth(request: Request) {
  const session = await getSession(request.headers.get('Cookie'));
  return session.get('jwt');
}
export { getSession, commitSession, destroySession, getAuth };
//
// const getUserSession = async (request: Request) => {
//   return await getSession(request.headers.get('Cookie'));
// };
//
// /**
//  * Logs out the user by destroying their session.
//  * @param {Request} request - The incoming request.
//  * @returns {Promise<Response>} Redirect response after logout.
//  */
// export async function logout(request: Request) {
//   const session = await getUserSession(request);
//   return redirect('/', {
//     headers: {
//       'Set-Cookie': await destroySession(session),
//     },
//   });
// }
//
// export async function getUser(
//   request: Request,
// ): Promise<AuthResponse | undefined> {
//   const session = await getUserSession(request);
//   const userId = session.get('jwt');
//   return userId;
// }

// export async function createUserSession({
//   request,
//   jwt,
//   remember = true,
//   redirectUrl,
// }: {
//   request: Request;
//   jwt: AuthResponse;
//   remember: boolean;
//   redirectUrl?: string;
// }) {
//   const session = await getUserSession(request);
//   session.set('jwt', jwt);
//   return redirect(redirectUrl || '/', {
//     headers: {
//       'Set-Cookie': await commitSession(session, {
//         // httpOnly: true,
//         secure: true,
//         sameSite: 'lax',
//         maxAge: remember
//           ? jwt.expiresIn // 7 days
//           : undefined,
//       }),
//     },
//   });
// }
