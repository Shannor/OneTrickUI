import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from 'react-router';
import { getCachedUser, setAuth } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import type { AuthResponse } from '~/api';

const DEFAULT_DEV_USER_ID = 'TTXWDT9pzDEA0XiO1iAc';

async function handleDevLogin(request: Request, userIdParam?: string | null) {
  const isAllowedDevEnv =
    import.meta.env.DEV &&
    (!process.env.NODE_ENV ||
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test');

  if (!isAllowedDevEnv) {
    throw new Response('Not Found', { status: 404 });
  }

  const url = new URL(request.url);
  const userId =
    userIdParam?.trim() ||
    url.searchParams.get('userId')?.trim() ||
    process.env.DEV_USER_ID?.trim() ||
    DEFAULT_DEV_USER_ID;
  const redirectTo = url.searchParams.get('redirectTo');

  let membershipId = '4611686018434106050';
  try {
    const { data: profile } = await getCachedUser(request, userId);
    if (profile?.membershipId) {
      membershipId = profile.membershipId;
    }
  } catch {
    // Fallback to default membershipId if backend lookup fails
  }

  const fakeAuth: AuthResponse = {
    id: userId,
    accessToken: 'dev-local-access-token',
    tokenType: 'Bearer',
    expiresIn: 86400 * 30, // 30 days
    refreshToken: 'dev-local-refresh-token',
    refreshExpiresIn: 86400 * 90,
    membershipId,
    primaryMembershipId: membershipId,
    timestamp: new Date(),
  };

  const response = await setAuth(request, fakeAuth);
  if (
    redirectTo &&
    redirectTo.startsWith('/') &&
    !redirectTo.startsWith('//')
  ) {
    return redirect(redirectTo, {
      headers: response.headers,
    });
  }
  return response;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const log = getRequestLogger(context);
  log.set({ action: 'action/dev-login', method: 'GET' });
  return handleDevLogin(request);
}

export async function action({ request, context }: ActionFunctionArgs) {
  const log = getRequestLogger(context);
  log.set({ action: 'action/dev-login', method: 'POST' });
  const formData = await request.formData();
  const userId = formData.get('userId')?.toString();
  return handleDevLogin(request, userId);
}
