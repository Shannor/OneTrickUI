import { format } from 'date-fns';
import { PlusIcon, StopCircleIcon } from 'lucide-react';
import { useFetcher, useNavigate } from 'react-router';
import { type Session, getUserSessions } from '~/api';
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
import { useProfileData } from '~/lib/hooks';

import type { Route } from './+types/sessions';

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const page = Number(url.searchParams.get('page') || '0');
  const { characterId, id } = params;

  const res = await getUserSessions({
    path: {
      userId: id,
    },
    query: {
      count: 10,
      page: page,
      characterId,
      status: 'complete',
    },
  });
  const currentRes = await getUserSessions({
    path: {
      userId: id,
    },
    query: {
      count: 1,
      page: 0,
      characterId,
      status: 'pending',
    },
  });
  if (!res.data) {
    return {
      data: [],
      page,
      current: undefined,
    };
  }

  const current = currentRes.data?.at(0);
  return {
    data: res.data,
    current,
    page,
    characterId,
  };
}

export default function Sessions({ params, loaderData }: Route.ComponentProps) {
  const { type } = useProfileData();
  const { characterId, id: userId } = params;
  const { data, current } = loaderData;
  const isOwner = type === 'owner';
  const navigate = useNavigate();
  const { state, data: actionData, Form } = useFetcher();
  const isSubmitting = state === 'submitting';
  const hasCurrentSession = Boolean(current?.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-row justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Sessions
          </h2>
        </div>
        {isOwner && (
          <div className="flex flex-row gap-4">
            <Form method="post" action="/action/start-session">
              <input type="hidden" name="characterId" value={characterId} />
              <input type="hidden" name="userId" value={userId} />
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
            <Form method="post" action="/action/end-session">
              <input type="hidden" name="characterId" value={characterId} />
              <input type="hidden" name="sessionId" value={current?.id} />
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
        )}
      </div>
      <CurrentSession
        data={current}
        onClick={() => navigate(`${current?.id}`)}
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
            {!current && isOwner && (
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
              onClick={() => navigate(`${session.id}`)}
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
