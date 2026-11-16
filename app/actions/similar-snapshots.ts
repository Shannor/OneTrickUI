import { getRequestLogger } from '~/.server/logger';
import { getSimilarSnapshots } from '~/api';
import { slimSimilarSnapshotPage } from '~/hooks/use-loadout';

import type { Route } from './+types/similar-snapshots';

export async function loader({ request, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const url = new URL(request.url);
  const snapshotId = url.searchParams.get('snapshotId');

  log.set({
    action: 'action/similar-snapshots',
    snapshotId,
  });

  if (!snapshotId) {
    return Response.json(
      { error: 'snapshotId is required' },
      { status: 400 },
    );
  }

  try {
    const res = await getSimilarSnapshots({
      path: { snapshotId },
      query: { includeStats: true },
    });

    if (res.error || !res.data) {
      return Response.json(
        { error: 'Failed to load similar loadouts.' },
        { status: res.response?.status ?? 500 },
      );
    }

    return Response.json(slimSimilarSnapshotPage(res.data));

  } catch (err) {
    log.error(err instanceof Error ? err : String(err), {
      action: 'action/similar-snapshots',
      snapshotId,
    });
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to load similar loadouts.' },
      { status: 500 },
    );
  }
}
