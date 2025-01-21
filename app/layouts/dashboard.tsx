import {
  Outlet,
  data,
  redirect,
  useLoaderData,
  useLocation,
  useNavigation,
  useSubmit,
} from 'react-router';
import { getAuth, refreshHeaders } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { profile } from '~/api';
import { AppSidebar } from '~/components/app-sidebar';
import { ModeToggle } from '~/components/mode-toggle';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import { Skeleton } from '~/components/ui/skeleton';

import type { Route } from '../../.react-router/types/app/+types/root';

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (!auth) {
    return redirect('/login');
  }
  const { characterId } = await getPreferences(request);
  const { data: profileData } = await profile({
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.membershipId,
      'X-User-ID': auth.id,
    },
  });
  if (!profileData) {
    throw data('No profile data', { status: 500 });
  }

  const headers = await refreshHeaders(request, auth);
  return data(
    { profile: profileData, characterId },
    {
      ...headers,
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
            <Outlet context={{ profile, characterId }} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
