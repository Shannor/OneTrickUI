import { redirect } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { startSession } from '~/api';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions.ts';

export async function action({ request, context }: Route.ActionArgs) {
  const log = getRequestLogger(context);
  log.set({ action: 'startSession', route: 'actions/start-session' });
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

  log.set({
    user: { id: auth.id },
    session: { characterId: characterId.toString() },
  });

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
    log.error('failed to start session', {
      session: { characterId: characterId.toString(), error },
    });
    return { error: error };
  }
  if (!data) {
    return { error: 'No data' };
  }

  const targetUserId = data.userId || userId.toString();
  const targetCharId = data.characterId || characterId.toString();
  const target =
    redirectTo?.toString() ||
    `/profile/${targetUserId}/c/${targetCharId}/sessions/${data.id}`;

  return redirect(target);
}
