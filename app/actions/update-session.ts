import { getAuth, redirectBack } from '~/.server/auth';
import { Logger } from '~/.server/logger';
import { completeSession, updateSession } from '~/api';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions';

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const sessionId = formData.get('sessionId');
  const name = formData.get('name');
  const description = formData.get('description');

  const auth = await getAuth(request);
  if (!auth) {
    return { error: 'No auth token' };
  }

  if (!sessionId) {
    return { error: 'No session id provided' };
  }

  if (!name) {
    return { error: 'Name required' };
  }

  const { data, error } = await updateSession({
    path: {
      sessionId: sessionId.toString(),
    },
    body: {
      name: name?.toString(),
      description: description?.toString(),
    },
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });
  if (error) {
    Logger.error(error, 'failed to update session');
    return { error: error };
  }
  if (!data) {
    return { error: 'No data' };
  }
  return redirectBack(request, { fallback: '/' });
}
