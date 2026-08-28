import { z } from 'zod';
import { getAuth } from '~/.server/auth';
import { mergeSnapshots } from '~/api';
import { Logger } from '~/lib/logger';

import type { Route } from './+types/merge-loadout';

const mergeSchema = z.object({
  baseLoadoutId: z.string(),
  targetLoadoutId: z.string(),
});

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const submission = mergeSchema.safeParse(Object.fromEntries(formData));

  const auth = await getAuth(request);
  if (!auth) {
    return { error: 'No auth token' };
  }

  if (!submission.success) {
    return { error: 'Invalid submission' };
  }
  Logger.info({ data: submission.data }, 'Merging loadouts');
  await mergeSnapshots({
    path: {
      snapshotId: submission.data.baseLoadoutId,
    },
    body: {
      sourceSnapshotId: submission.data.targetLoadoutId,
    },
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-User-ID': auth.id,
    },
  });
  return { ok: true };
}
