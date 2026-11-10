import { z } from 'zod';
import { getAuth } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { mergeSnapshots } from '~/api';

import type { Route } from './+types/merge-loadout';

const mergeSchema = z.object({
  baseLoadoutId: z.string(),
  targetLoadoutId: z.string(),
});

export async function action({ request, context }: Route.ActionArgs) {
  const log = getRequestLogger(context);
  log.set({ action: 'mergeLoadout', route: 'actions/merge-loadout' });
  const formData = await request.formData();
  const submission = mergeSchema.safeParse(Object.fromEntries(formData));

  const auth = await getAuth(request);
  if (!auth) {
    return { error: 'No auth token' };
  }

  if (!submission.success) {
    return { error: 'Invalid submission' };
  }
  log.set({
    user: { id: auth.id },
    loadoutMerge: {
      baseLoadoutId: submission.data.baseLoadoutId,
      targetLoadoutId: submission.data.targetLoadoutId,
    },
  });
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
