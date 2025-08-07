import { format } from 'date-fns';
import { PlusIcon } from 'lucide-react';
import {
  data,
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
  useNavigate,
  useSubmit,
} from 'react-router';
import { getAuth } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { createSnapshot, getSnapshots, profile } from '~/api';
import { LoadingButton } from '~/components/loading-button';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

import type { Route } from './+types/snapshots';

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

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const page = url.searchParams.get('page') || 0;
  const auth = await getAuth(request);
  if (!auth) {
    throw new Error('Not logged in');
  }

  const { character } = await getPreferences(request);
  if (!character) {
    throw data('No character');
  }

  const res = await getSnapshots({
    query: {
      count: 10,
      page: Number(page),
      characterId: character.id,
    },
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-User-ID': auth.id,
    },
  });
  if (!res.data) {
    throw data('Records Not Found', { status: 404 });
  }
  return {
    snapshots: res.data,
    characterId: character.id,
  };
}

export async function action({ request }: Route.ClientActionArgs) {
  const d = await request.formData();
  const characterId = d.get('characterId');

  if (!characterId) {
    return { message: 'No character id' };
  }
  const auth = await getAuth(request);
  if (!auth) {
    return { message: 'No auth token' };
  }
  const { data, error } = await createSnapshot({
    body: {
      characterId: characterId.toString(),
    },
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });
  if (error) {
    console.error(error);
  }
  if (!data) {
    return { message: 'No data' };
  }
  return data;
}

export default function Snapshots({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const { snapshots, characterId } = loaderData;
  const navigate = useNavigate();

  const isSubmitting = fetcher.state === 'submitting';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Snapshots
          </h2>
          <p>
            Snapshots are equipped loadouts that your character was wearing at
            the time.
          </p>
        </div>
        <fetcher.Form method="post">
          <input type="hidden" name="characterId" value={characterId} />
          <LoadingButton
            type="submit"
            variant="outline"
            disabled={!characterId || isSubmitting}
            isLoading={isSubmitting}
          >
            <PlusIcon className="h-4 w-4" />
            Create New Snapshot
          </LoadingButton>
        </fetcher.Form>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {snapshots?.map((snapshot) => (
          <Card
            key={snapshot.id}
            className="cursor-pointer"
            onClick={() => navigate(`/dashboard/loadouts/${snapshot.id}`)}
          >
            <CardHeader>
              <CardTitle>
                {snapshot.name} -{' '}
                {format(new Date(snapshot.createdAt), 'MM/dd/yyyy - p')}
              </CardTitle>
              <CardDescription>
                {Object.values(snapshot.loadout).map((it) => (
                  <div key={it.details.baseInfo.itemHash}>
                    {it.details.baseInfo.name}
                  </div>
                ))}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
