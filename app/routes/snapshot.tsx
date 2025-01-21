import { format } from 'date-fns';
import { data, isRouteErrorResponse, useLoaderData } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { getSnapshot } from '~/api';

import type { Route } from './+types/snapshot';

export function meta({ location }: Route.MetaArgs) {}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
export async function loader({ request, params }: Route.LoaderArgs) {
  const { snapshotId } = params;
  const auth = await getAuth(request);
  const { characterId } = await getPreferences(request);

  if (!characterId) {
    throw data('No character id', { status: 400 });
  }

  const result = await getSnapshot({
    path: { snapshotId },
    query: {
      characterId,
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

export default function Snapshot({}: Route.ComponentProps) {
  const snapshot = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4 justify-between">
        <div className="flex flex-col">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Snapshot - {format(new Date(snapshot.timestamp), 'MM/dd/yyyy - p')}
          </h2>
          <p>
            Snapshots are equipped loadouts that your character was wearing at
            the time.
          </p>
        </div>
      </div>
    </div>
  );
}
