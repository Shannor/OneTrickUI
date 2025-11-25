import { Link, useNavigate } from 'react-router';
import { getUserSessions } from '~/api';
import { Empty } from '~/components/empty';
import { SessionCard } from '~/components/session-card';
import { Button } from '~/components/ui/button';
import { useProfileData } from '~/lib/hooks';

import type { Route } from './+types/home';

export async function loader({ params }: Route.LoaderArgs) {
  const { characterId, id } = params;
  const { data, error } = await getUserSessions({
    path: {
      userId: id,
    },
    query: {
      count: 1,
      page: 0,
      characterId,
    },
  });
  if (error) {
    return { session: undefined, error: error };
  }

  return { session: data?.at(0), error: undefined };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const data = useProfileData();
  const { session, error } = loaderData;

  if (!data) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <Empty title="Unexpected Error" description="Failed to load home page" />
    );
  }

  if (data.type === 'error') {
    return null;
  }
  if (data.type === 'viewer' || data.type === 'owner') {
    const { profile, type, character } = data;
    return (
      <div>
        <title>{`${profile.displayName} - ${character?.class ?? 'Home'}`}</title>
        <meta
          property="og:title"
          content={`${profile.displayName} - ${character?.class ?? 'Home'}`}
        />
        <meta
          name="description"
          content={`Home page for ${profile.displayName}`}
        />
        <div className="flex flex-col gap-4">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            {type === 'viewer' ? 'Viewing' : 'Welcome'} {profile.displayName}!
          </h2>
          <div className="w-1/3">
            {session ? (
              <section className="flex flex-col gap-4">
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  {session.completedAt ? 'Last' : 'Active'} Session
                </h3>
                <SessionCard
                  onClick={() => navigate(`sessions/${session.id}`)}
                  session={session}
                />
              </section>
            ) : (
              <Empty title="No Session recorded" description="Start a session!">
                <Button asChild>
                  <Link to="sessions">Start Session</Link>
                </Button>
              </Empty>
            )}
          </div>
        </div>
      </div>
    );
  }
}
