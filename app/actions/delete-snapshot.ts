import { redirect } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { deleteSnapshot } from '~/api';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions.ts';

export async function action({ request, context }: Route.ActionArgs) {
  const log = getRequestLogger(context);
  log.set({ action: 'deleteSnapshot', route: 'actions/delete-snapshot' });
  const formData = await request.formData();
  const snapshotId = formData.get('snapshotId');
  const characterId = formData.get('characterId');
  const ownerId = formData.get('userId');
  const redirectTo = formData.get('redirectTo');

  if (!snapshotId) {
    log.set({ snapshot: { error: 'missing_snapshot_id' } });
    return { error: 'No snapshot id provided' };
  }

  const auth = await getAuth(request);
  if (!auth) {
    log.set({
      snapshot: { id: snapshotId.toString(), error: 'unauthorized' },
    });
    return { error: 'Unauthorized' };
  }

  log.set({
    user: { id: auth.id },
    snapshot: {
      id: snapshotId.toString(),
      characterId: characterId?.toString(),
    },
  });

  if (ownerId && ownerId.toString() !== auth.id) {
    log.warn('Unauthorized attempt to delete another user snapshot', {
      authUser: auth.id,
      targetOwner: ownerId.toString(),
    });
    return { error: 'Forbidden: You can only delete your own loadouts' };
  }

  const { error } = await deleteSnapshot({
    path: {
      snapshotId: snapshotId.toString(),
    },
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });

  if (error) {
    log.error('failed to delete snapshot', {
      snapshot: { id: snapshotId.toString(), error },
    });
    return { error };
  }

  const target =
    redirectTo?.toString() ||
    (characterId
      ? `/profile/${auth.id}/c/${characterId}/loadouts`
      : `/profile/${auth.id}`);

  const separator = target.includes('?') ? '&' : '?';
  return redirect(`${target}${separator}toast=snapshot_deleted`);
}
