import { AppSidebar } from '~/components/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import {
  data,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useNavigation,
  useSubmit,
} from 'react-router';
import { Skeleton } from '~/components/ui/skeleton';
import { ModeToggle } from '~/components/mode-toggle';
import { commitSession, getSession } from '~/routes/auth.server';
import type { Route } from '../../.react-router/types/app/+types/root';
import { profile, refreshToken } from '~/api';
import { getPreferences } from '~/.server/preferences';

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  let auth = session.get('jwt');

  if (!auth) {
    return redirect('/login');
  }

  const expiresMillisecond = auth.expiresIn * 1000;
  const givenTime = new Date(auth.timestamp).getTime();
  if (Date.now() >= givenTime + expiresMillisecond) {
    const { data: jwt } = await refreshToken({
      body: {
        code: auth.refreshToken.toString(),
      },
    });
    // TODO: If we fail to refresh then we need to clear the cookie and send it to login
    if (jwt) {
      session.set('jwt', jwt);
      auth = jwt;
    }
  }
  const preferences = await getPreferences(request.headers.get('Cookie'));
  const { data: profileData } = await profile({
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.membershipId,
      'X-User-ID': auth.id,
    },
  });
  if (!profileData) {
    throw new Error('No data');
  }

  return data(
    { profile: profileData, characterId: preferences.get('characterId') },
    {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    },
  );
}

export default function Dashboard() {
  const navigation = useNavigation();
  const location = useLocation();
  const isNavigating = Boolean(navigation.location);
  const { profile, characterId } = useLoaderData<typeof loader>();

  const submit = useSubmit();
  return (
    <SidebarProvider>
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
        <div className="flex w-full flex-1 flex-col overflow-y-auto px-6 pb-4 xl:mx-auto 2xl:max-w-[1440px] 2xl:p-0">
          {isNavigating ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-[60px] w-full rounded-full" />
              <Skeleton className="h-[60px] w-full rounded-full" />
              <Skeleton className="h-[60px] w-full rounded-full" />
              <Skeleton className="h-[60px] w-full rounded-full" />
              <Skeleton className="h-[60px] w-full rounded-full" />
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
