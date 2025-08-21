import { data, redirect, useNavigate, useRouteLoaderData } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { getSessions } from '~/api';
import { Empty } from '~/components/empty';
import { SessionCard } from '~/components/session-card';
import { useIsNavigating } from '~/lib/hooks';

import type { Route } from './+types/home';

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (!auth) {
    return redirect('/login');
  }
  const { character } = await getPreferences(request);

  if (!character) {
    return { error: 'no character picked', session: undefined };
  }
  const session = await getSessions({
    query: {
      count: 1,
      page: 0,
      characterId: character.id,
    },
    headers: {
      'X-Membership-ID': auth.primaryMembershipId,
      'X-User-ID': auth.id,
    },
  });
  return data({ session: session.data?.at(0), error: undefined });
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [isNavigating] = useIsNavigating();
  const { character, profile } = useRouteLoaderData('layouts/sidebar');
  const { session, error } = loaderData;

  if (error) {
    return <Empty title={error} description="Failed to load home page" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Welcome, {profile.displayName}!
      </h2>
      <div className="w-1/3">
        {session ? (
          <section className="flex flex-col gap-4">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              {session.completedAt ? 'Last' : 'Active'} Session
            </h3>
            <SessionCard
              onClick={() => navigate(`/dashboard/sessions/${session.id}`)}
              session={session}
            />
          </section>
        ) : (
          <Empty title="No Session recorded" description="Start a session!" />
        )}
      </div>
    </div>
  );
}
