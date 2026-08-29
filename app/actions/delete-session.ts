import { redirect } from 'react-router';
import { getAuth } from '~/.server/auth';
import { deleteSession } from '~/api';
import { Logger } from '~/lib/logger';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions.ts';

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const sessionId = formData.get('sessionId');
  const characterId = formData.get('characterId');
  const ownerId = formData.get('userId');
  const redirectTo = formData.get('redirectTo');

  if (!sessionId) {
    return { error: 'No session id provided' };
  }

  const auth = await getAuth(request);
  if (!auth) {
    return { error: 'Unauthorized' };
  }

  if (ownerId && ownerId.toString() !== auth.id) {
    Logger.warn(
      { authUser: auth.id, targetOwner: ownerId },
      'Unauthorized attempt to delete another user session',
    );
    return { error: 'Forbidden: You can only delete your own sessions' };
  }

  const { error } = await deleteSession({
    path: {
      sessionId: sessionId.toString(),
    },
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });

  if (error) {
    Logger.error(error, 'failed to delete session');
    return { error };
  }

  const target =
    redirectTo?.toString() ||
    (characterId
      ? `/profile/${auth.id}/c/${characterId}/sessions`
      : `/profile/${auth.id}`);

  const separator = target.includes('?') ? '&' : '?';
  return redirect(`${target}${separator}toast=session_deleted`);
}
