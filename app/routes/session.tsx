import { useFetcher, useLoaderData } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getSession, getSessionAggregates } from '~/api';
import useLocalStorage from '~/hooks/use-local-storage';

import type { Route } from '../../.react-router/types/app/routes/+types/session';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { sessionId } = params;

  const auth = await getAuth(request);
  if (!auth) {
    throw new Error('Not authenticated');
  }

  const res = await getSession({
    path: {
      sessionId,
    },
    headers: {
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });

  if (!res.data) {
    return { session: undefined, error: 'Session Not Found' };
  }
  const aggRes = await getSessionAggregates({
    path: {
      sessionId,
    },
    headers: {
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });
  if (!aggRes.data) {
    return { session: res.data, aggregates: [], error: undefined };
  }
  return { session: res.data, aggregates: aggRes.data, error: undefined };
}
const LAST_POLL_KEY = 'lastPoll';
interface PollData {
  sessionId: string;
  lastPoll: number;
}
export default function Session() {
  const { session, error, aggregates } = useLoaderData<typeof loader>();
  const { Form } = useFetcher();

  const lastPoll = useLocalStorage<PollData>(LAST_POLL_KEY, {
    sessionId: '',
    lastPoll: 0,
  });
  if (!session) {
    return <div>Session Not Found. Go Back</div>;
  }

  const isCurrent = session.status === 'pending';

  return (
    <div>
      <h1 className="">{session.name}</h1>
      <Form>
        <input type="text" hidden name="sessionId" value={session.id} />
      </Form>
      {(aggregates?.length ?? 0) === 0 && <div> No Aggregates Yet ...</div>}
      {aggregates?.map((aggregate) => {
        return <div key={aggregate.id}>{aggregate.activityId}</div>;
      })}
    </div>
  );
}
