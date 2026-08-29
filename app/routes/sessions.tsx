import {
  ChevronLeft,
  ChevronRight,
  PlusIcon,
  StopCircleIcon,
} from 'lucide-react';
import { Link, useFetcher, useNavigate } from 'react-router';
import { type Session, getUserSessions } from '~/api';
import { Empty } from '~/components/empty';
import { LoadingButton } from '~/components/loading-button';
import { SessionCard } from '~/components/session-card';
import { Button } from '~/components/ui/button';
import { useProfileData } from '~/hooks/use-route-loaders';
import { cn } from '~/lib/utils';

import type { Route } from './+types/sessions';

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const rawPage = Number(url.searchParams.get('page') || '1');
  const page = Math.max(1, Number.isNaN(rawPage) ? 1 : rawPage);
  const apiPage = BigInt(page - 1);
  const { characterId, id } = params;

  const res = await getUserSessions({
    path: {
      userId: id,
    },
    query: {
      count: BigInt(10),
      page: apiPage,
      characterId,
      status: 'complete',
    },
  });
  const currentRes = await getUserSessions({
    path: {
      userId: id,
    },
    query: {
      count: BigInt(1),
      page: BigInt(0),
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

export function Sessions({ params, loaderData }: Route.ComponentProps) {
  const { type, profile } = useProfileData();
  const { characterId, id: userId } = params;
  const { data, current, page } = loaderData;
  const isOwner = type === 'owner';
  const navigate = useNavigate();
  const { state, Form } = useFetcher();
  const isSubmitting = state === 'submitting';
  const hasCurrentSession = Boolean(current?.id);

  const pageTitle = isOwner
    ? 'My Sessions'
    : `${profile?.displayName ?? 'Guardian'}'s Sessions`;

  return (
    <div className="flex w-full max-w-full flex-col gap-8 overflow-hidden">
      <title>{`${pageTitle} - 1 Trick`}</title>
      <meta property="og:title" content={`${pageTitle} - 1 Trick`} />
      <meta name="description" content="View and manage 1 Trick sessions." />
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div className="flex flex-col">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            {pageTitle}
          </h2>
        </div>
        {isOwner && (
          <div className="flex flex-row gap-4">
            {hasCurrentSession ? (
              <Form
                method="post"
                action="/action/end-session"
                className="w-full"
              >
                <input type="hidden" name="characterId" value={characterId} />
                <input type="hidden" name="sessionId" value={current?.id} />
                <LoadingButton
                  type="submit"
                  variant="outline"
                  disabled={!characterId || isSubmitting}
                  isLoading={isSubmitting}
                  className={cn('w-full lg:w-auto')}
                >
                  <StopCircleIcon className="h-4 w-4" />
                  Stop Session
                </LoadingButton>
              </Form>
            ) : (
              <Form
                method="post"
                action="/action/start-session"
                className="w-full"
              >
                <input type="hidden" name="characterId" value={characterId} />
                <input type="hidden" name="userId" value={userId} />
                <LoadingButton
                  type="submit"
                  variant="default"
                  disabled={!characterId || isSubmitting}
                  isLoading={isSubmitting}
                  className={cn('w-full lg:w-auto')}
                >
                  <PlusIcon className="h-4 w-4" />
                  Start Session
                </LoadingButton>
              </Form>
            )}
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
            title={current ? 'No Completed Sessions' : 'No Sessions'}
            description={
              current
                ? 'Finish your current session to see your completed sessions here.'
                : 'Start your first session to track activities automatically'
            }
          >
            {!current && isOwner && (
              <Form
                method="post"
                action="/action/start-session"
                className="w-full"
              >
                <input type="hidden" name="characterId" value={characterId} />
                <input type="hidden" name="userId" value={userId} />
                <LoadingButton
                  type="submit"
                  variant="default"
                  disabled={!characterId || isSubmitting}
                  isLoading={isSubmitting}
                  className="mt-8 w-full"
                >
                  <PlusIcon className="h-4 w-4" />
                  Start First Session
                </LoadingButton>
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
      <div className="flex w-full flex-row items-center justify-between gap-3 sm:w-auto sm:self-end">
        {page <= 1 ? (
          <Button
            disabled
            variant="outline"
            size="sm"
            className="sm:size-default"
          >
            <ChevronLeft />
            <span>Previous</span>
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="sm:size-default"
          >
            <Link to={page - 1 === 1 ? '?' : `?page=${page - 1}`}>
              <ChevronLeft />
              <span>Previous</span>
            </Link>
          </Button>
        )}
        {data.length === 10 ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="sm:size-default"
          >
            <Link to={`?page=${page + 1}`}>
              <span>Next</span>
              <ChevronRight />
            </Link>
          </Button>
        ) : (
          <Button
            disabled
            variant="outline"
            size="sm"
            className="sm:size-default"
          >
            <span>Next</span>
            <ChevronRight />
          </Button>
        )}
      </div>
    </div>
  );
}

function CurrentSession({
  data,
  onClick,
}: {
  data?: Session;
  onClick: () => void;
}) {
  if (!data) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
        Active Session
      </h3>
      <SessionCard session={data} onClick={onClick} />
    </div>
  );
}

export default Sessions;
