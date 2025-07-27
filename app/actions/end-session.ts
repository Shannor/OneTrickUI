import { getAuth, redirectBack } from '~/.server/auth';
import { Logger } from '~/.server/logger';
import { updateSession } from '~/api';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions';

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const characterId = formData.get('characterId');
  const sessionId = formData.get('sessionId');

  if (!characterId) {
    return { error: 'No character id' };
  }

  const auth = await getAuth(request);
  if (!auth) {
    return { error: 'No auth token' };
  }

  if (!sessionId) {
    return { error: 'No session id provided' };
  }

  const { data, error } = await updateSession({
    path: {
      sessionId: sessionId.toString(),
    },
    body: {
      characterId: characterId.toString(),
      name: 'random name',
      completedAt: new Date().toISOString(),
    },
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });
  if (error) {
    Logger.error(error, 'failed to end session');
    return { error: error };
  }
  if (!data) {
    return { error: 'No data' };
  }
  return redirectBack(request, { fallback: '/' });
}
