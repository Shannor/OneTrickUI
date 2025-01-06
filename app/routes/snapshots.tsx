import type { Route } from './+types/snapshots';
import { createSnapshot, getSnapshots } from '~/api';
import { data, useLoaderData, useSubmit } from 'react-router';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export function meta({ location }: Route.MetaArgs) {}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const page = url.searchParams.get('page') || 0;
  const res = await getSnapshots({
    query: {
      count: 10,
      page: Number(page),
    },
  });
  if (!res.data) {
    throw data('Record Not Found', { status: 404 });
  }
  return res.data;
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const { data, error } = await createSnapshot();
  if (error) {
    return error;
  }
  if (!data) {
    return { message: 'No data' };
  }
  return data;
}

export default function Snapshots({ actionData }: Route.ComponentProps) {
  const submit = useSubmit();
  const data = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Snapshots
        </h2>
        <Button
          onClick={() =>
            submit(null, { method: 'post', encType: 'application/json' })
          }
        >
          Create New Snapshot
        </Button>
      </div>
      {data?.map((snapshot) => (
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
