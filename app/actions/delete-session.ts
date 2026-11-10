import { redirect } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { deleteSession } from '~/api';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions.ts';

export async function action({ request, context }: Route.ActionArgs) {
  const log = getRequestLogger(context);
  log.set({ action: 'deleteSession', route: 'actions/delete-session' });
  const formData = await request.formData();
  const sessionId = formData.get('sessionId');
  const characterId = formData.get('characterId');
  const ownerId = formData.get('userId');
  const redirectTo = formData.get('redirectTo');

  if (!sessionId) {
    log.set({ session: { error: 'missing_session_id' } });
    return { error: 'No session id provided' };
  }

  const auth = await getAuth(request);
  if (!auth) {
    log.set({ session: { id: sessionId.toString(), error: 'unauthorized' } });
    return { error: 'Unauthorized' };
  }

  log.set({
    user: { id: auth.id },
    session: {
      id: sessionId.toString(),
      characterId: characterId?.toString(),
    },
  });

  if (ownerId && ownerId.toString() !== auth.id) {
    log.warn('Unauthorized attempt to delete another user session', {
      authUser: auth.id,
      targetOwner: ownerId.toString(),
    });
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
    log.error('failed to delete session', {
      session: { id: sessionId.toString(), error },
    });
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
