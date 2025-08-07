import { format } from 'date-fns';
import { data, isRouteErrorResponse, useLoaderData } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { getSnapshot } from '~/api';

import type { Route } from './+types/snapshot';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { snapshotId } = params;
  const auth = await getAuth(request);
  const { character } = await getPreferences(request);
  if (!auth) {
    throw new Error('Not authenticated');
  }

  if (!character) {
    throw data('No character', { status: 400 });
  }

  const result = await getSnapshot({
    path: { snapshotId },
    query: {
      characterId: character.id,
    },
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-User-ID': auth.id,
    },
  });
  if (!result.data) {
    throw data('Record Not Found', { status: 404 });
  }
  return result.data;
}

export default function Snapshot({ loaderData }: Route.ComponentProps) {
  const snapshot = loaderData;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Snapshot - {format(new Date(snapshot.createdAt), 'MM/dd/yyyy - p')}
            {snapshot.id}
          </h2>
          <p>
            Snapshots are equipped loadouts that your character was wearing at
            the time.
          </p>
        </div>
        <div>TBD</div>
      </div>
    </div>
  );
}
