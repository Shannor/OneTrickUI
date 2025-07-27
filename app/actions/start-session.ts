import { getAuth, redirectBack } from '~/.server/auth';
import { Logger } from '~/.server/logger';
import { startSession } from '~/api';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions';

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const characterId = formData.get('characterId');
  const userId = formData.get('userId');
  const redirectTo = formData.get('redirectTo');

  if (!characterId) {
    return { error: 'No character id' };
  }

  if (!userId) {
    return { error: 'No user id' };
  }

  const auth = await getAuth(request);
  if (!auth) {
    return { error: 'No auth token' };
  }

  const { data, error } = await startSession({
    body: {
      characterId: characterId.toString(),
      userId: userId.toString(),
    },
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });
  if (error) {
    Logger.error(error, 'failed to start session');
    return { error: error };
  }
  if (!data) {
    return { error: 'No data' };
  }
  return redirectBack(request, { fallback: redirectTo?.toString() ?? '/' });
}
