import { redirect } from 'react-router';
import { getAuth } from '~/.server/auth';
import { deleteSnapshot } from '~/api';
import { Logger } from '~/lib/logger';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions.ts';

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const snapshotId = formData.get('snapshotId');
  const characterId = formData.get('characterId');
  const ownerId = formData.get('userId');
  const redirectTo = formData.get('redirectTo');

  if (!snapshotId) {
    return { error: 'No snapshot id provided' };
  }

  const auth = await getAuth(request);
  if (!auth) {
    return { error: 'Unauthorized' };
  }

  if (ownerId && ownerId.toString() !== auth.id) {
    Logger.warn(
      { authUser: auth.id, targetOwner: ownerId },
      'Unauthorized attempt to delete another user snapshot',
    );
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
    Logger.error(error, 'failed to delete snapshot');
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
