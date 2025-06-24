import { format } from 'date-fns';
import { PlusIcon, StopCircleIcon } from 'lucide-react';
import { useFetcher, useLoaderData, useNavigate } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { type Session, getSessions, startSession, updateSession } from '~/api';
import { Empty } from '~/components/empty';
import { LoadingButton } from '~/components/loading-button';
import { SessionCard } from '~/components/session-card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

import type { Route } from '../../.react-router/types/app/routes/+types/sessions';

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const page = Number(url.searchParams.get('page') || '0');

  const auth = await getAuth(request);
  if (!auth) {
    throw new Error('Not authenticated');
  }

  const { characterId } = await getPreferences(request);
  if (!characterId) {
    return { data: [], page, error: 'No character id' };
  }

  const res = await getSessions({
    query: {
      count: 10,
      page: page,
      characterId,
      status: 'complete',
    },
    headers: {
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });

  const currentRes = await getSessions({
    query: {
      count: 1,
      page: page,
      characterId,
      status: 'pending',
    },
    headers: {
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });
  if (!res.data) {
    return { data: [], page, current: undefined, error: 'No records found' };
  }

  const current = currentRes.data?.at(0);
  return { data: res.data, current, page, characterId };
}

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const characterId = formData.get('characterId');
  const sessionId = formData.get('sessionId');
  const actionType = formData.get('actionType');
  if (!characterId) {
    return { error: 'No character id' };
  }
  if (!actionType) {
    return { error: 'Missing action type' };
  }

  const auth = await getAuth(request);
  if (!auth) {
    return { error: 'No auth token' };
  }
  switch (actionType) {
    case 'start': {
      const { data, error } = await startSession({
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
        console.log('In error', error);
        return { error: error };
      }
      if (!data) {
        return { error: 'No data' };
      }
      return { data };
    }

    case 'end': {
      if (!sessionId) {
        return { error: 'No session id to end with' };
      }
      const { data, error } = await updateSession({
        path: {
          sessionId: sessionId.toString(),
        },
        body: {
          characterId: characterId.toString(),
          name: 'random name',
          completedAt: new Date().toISOString(),
        },
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'X-Membership-ID': auth.primaryMembershipId,
          'X-User-ID': auth.id,
        },
      });
      if (error) {
        console.log('In error', error);
        return { error: error };
      }
      if (!data) {
        return { error: 'No data' };
      }
      return { data };
    }
  }
}

export default function Sessions() {
  const { data, characterId, error, current } = useLoaderData<typeof loader>();

  const navigate = useNavigate();

  const { state, data: actionData, Form } = useFetcher();

  const isSubmitting = state === 'submitting';

  if (!characterId) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          No Character Selected. Please choose a character from the profile
          page.
        </h2>
      </div>
    );
  }

  const hasCurrentSession = Boolean(current?.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-row justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Sessions
          </h2>
        </div>
        <div className="flex flex-row gap-4">
          <Form method="post">
            <input type="hidden" name="characterId" value={characterId} />
            <input type="hidden" name="actionType" value="start" />
            <LoadingButton
              type="submit"
              variant="outline"
              disabled={!characterId || isSubmitting || hasCurrentSession}
              isLoading={isSubmitting}
              className={`${isSubmitting ? 'opacity-50' : ''}`}
            >
              <PlusIcon className="h-4 w-4" />
              Start New Session
            </LoadingButton>
          </Form>
          <Form method="post">
            <input type="hidden" name="characterId" value={characterId} />
            <input type="hidden" name="sessionId" value={current?.id} />
            <input type="hidden" name="actionType" value="end" />
            <LoadingButton
              type="submit"
              variant="outline"
              disabled={!characterId || isSubmitting || !hasCurrentSession}
              isLoading={isSubmitting}
              className={`${isSubmitting ? 'opacity-50' : ''}`}
            >
              <StopCircleIcon className="h-4 w-4" />
              Stop Session
            </LoadingButton>
          </Form>
        </div>
      </div>
      <CurrentSession
        data={current}
        onClick={() => navigate(`/sessions/${current?.id}`)}
      />
      <div>
        {data.length === 0 && (
          <Empty
            title={`No ${current && 'Completed'} Sessions`}
            description={
              current
                ? 'Finish your current session to see your completed sessions here.'
                : 'Start your first session to track activities automatically'
            }
          >
            {!current && (
              <Form method="post">
                <input type="hidden" name="characterId" value={characterId} />
                <Button type="submit" className="mt-8 w-full">
                  <PlusIcon className="h-4 w-4" />
                  Start First Session
                </Button>
              </Form>
            )}
          </Empty>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
        {data
          .sort(
            (a, b) =>
              new Date(b.completedAt ?? a.startedAt).getTime() -
              new Date(a.completedAt ?? a.startedAt).getTime(),
          )
          .map((session) => (
            <SessionCard
              key={session.id}
              onClick={() => navigate(`/sessions/${session.id}`)}
              session={session}
            />
          ))}
      </div>
    </div>
  );
}

function CurrentSession({
  data,
  onClick,
}: {
  data?: Session;
  onClick?: () => void;
}) {
  if (!data) {
    return null;
  }
  return (
    <Card onClick={onClick} className="cursor-pointer" key={data.id}>
      <CardHeader className="flex flex-col gap-4">
        <CardTitle className="flex flex-row items-center gap-4">
          <Badge className="animate-pulse">Active</Badge>
          {data.name}
        </CardTitle>
        <CardDescription className="flex flex-row items-center gap-4 text-lg">
          {format(new Date(data.startedAt), 'MM/dd/yyyy - p')}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
