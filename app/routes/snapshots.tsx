import type { Route } from './+types/snapshots';
import { createSnapshot, getSnapshots, profile } from '~/api';
import {
  data,
  Form,
  redirect,
  useLoaderData,
  useOutletContext,
  useSubmit,
} from 'react-router';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { getSession } from '~/routes/auth.server';
import { getPreferences } from '~/.server/preferences';

export function meta({ location }: Route.MetaArgs) {}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const page = url.searchParams.get('page') || 0;
  const session = await getSession(request.headers.get('Cookie'));
  const auth = session.get('jwt');
  console.log('Got Auth successfully', auth);
  if (!auth) {
    throw new Error('Not authenticated');
  }
  const preferences = await getPreferences(request.headers.get('Cookie'));
  const { data: profileData } = await profile({
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.membershipId,
      'X-User-ID': auth.id,
    },
  });
  const characterId = preferences.get('characterId');
  if (!characterId) {
    throw data('No character id', { status: 404 });
  }
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
  const session = await getSession(request.headers.get('Cookie'));
  const auth = session.get('jwt');
  if (!auth) {
    throw new Error('Not authenticated');
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

  const formData = new FormData();
  formData.set('characterId', characterId);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Snapshots
        </h2>
        <Button onClick={() => submit(formData, { method: 'post' })}>
          Create New Snapshot
        </Button>
      </div>
      {snapshots?.map((snapshot) => (
        <Card key={snapshot.timestamp.toString()}>
          <CardHeader>
            <CardTitle>{snapshot.timestamp.toString()}</CardTitle>
            <CardDescription>
              {snapshot.items.map((it) => (
                <div key={it.details.baseInfo.itemHash}>
                  {it.details.baseInfo.name}
                </div>
              ))}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
