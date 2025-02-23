import {
  Outlet,
  data,
  redirect,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigation,
} from 'react-router';
import { getAuth, refreshHeaders } from '~/.server/auth';
import { Logger } from '~/.server/logger';
import { getPreferences } from '~/.server/preferences';
import { type Session, getSessions, profile } from '~/api';
import { AppSidebar } from '~/components/app-sidebar';
import { ModeToggle } from '~/components/mode-toggle';
import SessionTracker from '~/components/session-tracker';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import { TooltipProvider } from '~/components/ui/tooltip';
import { useInterval } from '~/hooks/use-interval';

import type { Route } from '../../.react-router/types/app/+types/root';

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (!auth) {
    return redirect('/login');
  }
  const { characterId } = await getPreferences(request);
  const { data: profileData, error } = await profile({
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.membershipId,
      'X-User-ID': auth.id,
    },
  });
  if (error) {
    if (error.status === 'DestinyServerDown') {
      throw data(error.message, { status: 503 });
    }
    Logger.error(error.message, { error });
    throw data(error.message, { status: 500 });
  }
  if (!profileData) {
    throw data('No profile data', { status: 500 });
  }

  let session: Session | undefined = undefined;
  if (characterId) {
    const res = await getSessions({
      query: {
        count: 1,
        page: 0,
        status: 'pending',
        characterId,
      },
      headers: {
        'X-Membership-ID': auth.membershipId,
        'X-User-ID': auth.id,
      },
    });
    if (res.data?.length) {
      session = res.data[0];
    }
  }

  const headers = await refreshHeaders(request, auth);
  return data(
    {
      profile: profileData,
      characterId,
      currentSession: session,
      membershipId: auth.primaryMembershipId,
    },
    {
      ...headers,
    },
  );
}
const LAST_POLL_KEY = 'lastPoll';
interface PollData {
  sessionId: string;
  lastPoll: number;
}
export default function Dashboard() {
  const navigation = useNavigation();
  const location = useLocation();
  const { submit } = useFetcher();
  const isNavigating = Boolean(navigation.location);
  const { profile, characterId, currentSession, membershipId } =
    useLoaderData<typeof loader>();

  const runInterval = Boolean(
    currentSession?.status === 'pending' && currentSession?.id,
  );
  useInterval(
    async () => {
      if (runInterval && currentSession) {
        console.log('running interval call', characterId);
        const data = new FormData();
        data.set('sessionId', currentSession.id);
        data.set('membershipId', membershipId);
        await submit(data, {
          method: 'post',
          action: '/action/session-check-in',
        });
      }
    },
    runInterval ? 2000000 : null,
    { immediate: true },
  );
  return (
    <SidebarProvider>
      <TooltipProvider>
        <AppSidebar
          profile={profile}
          onChangeCharacter={(characterId) => {
            const data = new FormData();
            data.set('characterId', characterId);
            data.set('redirect', location.pathname);
            submit(data, {
              method: 'post',
              action: '/action/set-preference',
            }).catch(console.error);
          }}
          currentCharacterId={characterId}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
            <ModeToggle />
          </header>
          <SessionTracker session={currentSession} />
          <div className="flex w-full flex-1 flex-col overflow-y-auto px-6 pb-4 xl:mx-auto 2xl:max-w-[1440px] 2xl:p-0">
            {/*{isNavigating ? (*/}
            {/*  <div className="flex flex-col gap-4">*/}
            {/*    <Skeleton className="h-[60px] w-full rounded-full" />*/}
            {/*    <Skeleton className="h-[60px] w-full rounded-full" />*/}
            {/*    <Skeleton className="h-[60px] w-full rounded-full" />*/}
            {/*    <Skeleton className="h-[60px] w-full rounded-full" />*/}
            {/*    <Skeleton className="h-[60px] w-full rounded-full" />*/}
            {/*  </div>*/}
            {/*) : (*/}
            <Outlet context={{ profile, characterId, currentSession }} />
          </div>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
