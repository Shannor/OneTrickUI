import React from 'react';
import {
  Outlet,
  data,
  isRouteErrorResponse,
  redirect,
  useFetcher,
} from 'react-router';
import { getAuth, refreshHeaders } from '~/.server/auth';
import { getFireteamData } from '~/.server/fireteam';
import { getPreferences } from '~/.server/preferences';
import { type FireteamMember, getFireteam } from '~/api';
import { AppSidebar } from '~/components/app-sidebar';
import { ModeToggle } from '~/components/mode-toggle';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import { TooltipProvider } from '~/components/ui/tooltip';

import type { Route } from './+types/sidebar';

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (!auth) {
    return redirect('/login');
  }
  const headers = await refreshHeaders(request, auth);
  const { character, profile } = await getPreferences(request);
  if (!character) {
    return redirect('/character-select', { ...headers });
  }

  const fireteam = getFireteamData(request);
  return data(
    { character, profile, fireteam },
    {
      ...headers,
    },
  );
}

export default function Sidebar({ loaderData }: Route.ComponentProps) {
  const { submit } = useFetcher();
  const { character, fireteam, profile } = loaderData;

  return (
    <SidebarProvider>
      <TooltipProvider>
        <AppSidebar
          character={character}
          currentCharacterId={character?.id}
          onLogout={() => {
            submit(null, {
              method: 'post',
              action: '/dashboard/action/logout',
            }).catch(console.error);
          }}
          fireteam={fireteam}
          displayName={profile?.displayName ?? ''}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
            <ModeToggle />
          </header>
          <div className="flex w-full flex-1 flex-col overflow-y-auto px-6 pb-4 xl:mx-auto 2xl:max-w-[1440px] 2xl:p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
