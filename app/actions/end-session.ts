import { getAuth, redirectBack } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { completeSession } from '~/api';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions';

export async function action({ request, context }: Route.ActionArgs) {
  const log = getRequestLogger(context);
  log.set({ action: 'endSession', route: 'actions/end-session' });
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

  log.set({
    user: { id: auth.id },
    session: { id: sessionId.toString(), characterId: characterId.toString() },
  });

  const { data, error } = await completeSession({
    path: {
      sessionId: sessionId.toString(),
    },
    body: {
      characterId: characterId.toString(),
      completedAt: new Date().toISOString(),
    },
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });
  if (error) {
    log.error('failed to end session', {
      session: { id: sessionId.toString(), error },
    });
    return { error: error };
  }
  if (!data) {
    return { error: 'No data' };
  }
  return redirectBack(request, { fallback: '/' });
}
