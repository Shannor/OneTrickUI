import { format } from 'date-fns';
import { PlusIcon } from 'lucide-react';
import {
  data,
  isRouteErrorResponse,
  useLoaderData,
  useNavigate,
  useSubmit,
} from 'react-router';
import { getAuth } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { createSnapshot, getSnapshots, profile } from '~/api';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

import type { Route } from './+types/snapshots';

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
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const page = url.searchParams.get('page') || 0;
  const auth = await getAuth(request);
  if (!auth) {
    throw new Error('Not logged in');
  }

  const { characterId } = await getPreferences(request);
  if (!characterId) {
    throw data('No character id');
  }
  const { data: profileData } = await profile({
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.membershipId,
      'X-User-ID': auth.id,
    },
  });
  const res = await getSnapshots({
    query: {
      count: 10,
      page: Number(page),
      characterId: characterId,
    },
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-User-ID': auth.id,
    },
  });
  if (!res.data) {
    throw data('Records Not Found', { status: 404 });
  }
  return { snapshots: res.data, profile: profileData, characterId };
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

export default function Snapshots({ actionData }: Route.ComponentProps) {
  const submit = useSubmit();
  const { snapshots, characterId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const formData = new FormData();
  formData.set('characterId', characterId);
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
        <Button onClick={() => submit(formData, { method: 'post' })}>
          <PlusIcon className="h-4 w-4" />
          Create New Snapshot
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {snapshots?.map((snapshot) => (
          <Card
            key={snapshot.timestamp.toString()}
            className="cursor-pointer"
            onClick={() => navigate(`/snapshots/${snapshot.id}`)}
          >
            <CardHeader>
              <CardTitle>
                {format(new Date(snapshot.timestamp), 'MM/dd/yyyy - p')}
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
