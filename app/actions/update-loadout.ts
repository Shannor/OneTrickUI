import { getAuth, redirectBack } from '~/.server/auth';
import { Logger } from '~/.server/logger';
import { completeSession, updateSession, updateSnapshot } from '~/api';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions';

export async function action({ request }: Route.ClientActionArgs) {
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
    Logger.error(error, 'failed to update session');
    return { error: error };
  }
  if (!data) {
    return { error: 'No data' };
  }
  return redirectBack(request, { fallback: '/' });
}
