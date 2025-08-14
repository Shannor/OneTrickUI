import { Loader2 } from 'lucide-react';
import React from 'react';
import { Outlet, data, redirect, useFetcher } from 'react-router';
import { getAuth, refreshHeaders } from '~/.server/auth';
import { getFireteamData } from '~/.server/fireteam';
import { getPreferences } from '~/.server/preferences';
import { getSessions } from '~/api';
import { AppSidebar } from '~/components/app-sidebar';
import { ClientFallback } from '~/components/client-fallback';
import { FireteamPreview } from '~/components/fireteam-preview';
import { ModeToggle } from '~/components/mode-toggle';
import SessionTracker from '~/components/session-tracker';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import { Skeleton } from '~/components/ui/skeleton';
import { TooltipProvider } from '~/components/ui/tooltip';
import { Well } from '~/components/well';
import { useIsNavigating } from '~/lib/hooks';

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
  const { data: sessions } = await getSessions({
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
  return data(
    { character, profile, fireteam, session: sessions?.at(0) },
    {
      ...headers,
    },
  );
}

export default function Sidebar({ loaderData }: Route.ComponentProps) {
  const { submit } = useFetcher();
  const { character, fireteam, profile, session } = loaderData;
  const [isNavigating] = useIsNavigating();

  return (
    <SidebarProvider>
      <TooltipProvider>
        <AppSidebar
          character={character}
          currentCharacterId={character.id}
          onLogout={() => {
            submit(null, {
              method: 'post',
              action: '/dashboard/action/logout',
            }).catch(console.error);
          }}
          displayName={profile?.displayName ?? ''}
        >
          <>
            <ClientFallback
              errorFallback={
                <Well>
                  <div>Failed to Load Fireteam</div>
                </Well>
              }
              suspenseFallback={
                <div>
                  <Skeleton className="h-40 w-full" />
                </div>
              }
            >
              <Well>
                <FireteamPreview fireteamPromise={fireteam} />
              </Well>
            </ClientFallback>
            <SessionTracker
              session={session}
              membershipId={profile?.membershipId}
              characterId={character.id}
            />
          </>
        </AppSidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
            <ModeToggle />
          </header>
          <div className="relative flex w-full flex-1 flex-col overflow-y-auto px-6 pb-4 xl:mx-auto 2xl:max-w-[1440px] 2xl:p-6">
            {/* Overlay shown during route navigation */}
            {isNavigating ? (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex items-center gap-3 rounded-md border bg-background/80 px-4 py-3 shadow-sm">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              </div>
            ) : null}
            <Outlet />
          </div>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
