import { getAuth } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { mergeSnapshots } from '~/api';

import type { Route } from './+types/merge-loadout';

export async function action({ request, context }: Route.ActionArgs) {
  const log = getRequestLogger(context);
  log.set({ action: 'mergeLoadout', route: 'actions/merge-loadout' });
  const formData = await request.formData();

  const auth = await getAuth(request);
  if (!auth) {
    return { ok: false, error: 'No auth token' };
  }

  const rawBaseId =
    formData.get('baseLoadoutId') ??
    formData.get('targetSnapshotId') ??
    formData.get('snapshotId');
  const baseLoadoutId = typeof rawBaseId === 'string' ? rawBaseId.trim() : '';

  const rawValues = [
    ...formData.getAll('sourceSnapshotIds'),
    ...formData.getAll('sourceSnapshotId'),
    ...formData.getAll('targetLoadoutId'),
  ];

  const sourceSnapshotIds = Array.from(
    new Set(
      rawValues
        .filter((v): v is string => typeof v === 'string')
        .flatMap((val) => {
          const trimmed = val.trim();
          if (!trimmed) return [];
          if (trimmed.startsWith('[')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                return parsed.map(String).filter(Boolean);
              }
            } catch {
              // ignore invalid JSON
            }
          }
          return trimmed
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }),
    ),
  );

  if (!baseLoadoutId || sourceSnapshotIds.length === 0) {
    return { ok: false, error: 'Invalid submission' };
  }

  log.set({
    user: { id: auth.id },
    loadoutMerge: {
      baseLoadoutId,
      sourceSnapshotIds,
    },
  });

  const result = await mergeSnapshots({
    path: {
      snapshotId: baseLoadoutId,
    },
    body: {
      sourceSnapshotIds,
    },
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-User-ID': auth.id,
    },
  });

  if (result?.error) {
    const errorMessage =
      (result.error as { message?: string })?.message ||
      'Failed to merge loadouts';
    log.error('Failed to merge loadouts', {
      loadoutMerge: {
        baseLoadoutId,
        error: result.error,
      },
    });
    return {
      ok: false,
      error: errorMessage,
    };
  }

  return { ok: true };
}

