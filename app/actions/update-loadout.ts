import { getAuth, redirectBack } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { updateSnapshot } from '~/api';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions';

export async function action({ request, context }: Route.ActionArgs) {
  const log = getRequestLogger(context);
  log.set({ action: 'updateLoadout', route: 'actions/update-loadout' });
  const formData = await request.formData();
  const snapshotId = formData.get('snapshotId');
  const name = formData.get('name');
  const description = formData.get('description');

  const auth = await getAuth(request);
  if (!auth) {
    return { error: 'No auth token' };
  }

  if (!snapshotId) {
    return { error: 'No snapshot id provided' };
  }

  if (!name) {
    return { error: 'Name required' };
  }

  log.set({
    user: { id: auth.id },
    snapshot: { id: snapshotId.toString() },
  });

  const { data, error } = await updateSnapshot({
    path: {
      snapshotId: snapshotId.toString(),
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
    log.error('failed to update snapshot', {
      snapshot: { id: snapshotId.toString(), error },
    });
    return { error: error };
  }
  if (!data) {
    return { error: 'No data' };
  }
  return redirectBack(request, { fallback: '/' });
}
