import {
  Home,
  Hourglass,
  Loader2,
  SquareLibrary,
  UsersRound,
} from 'lucide-react';
import React from 'react';
import { Link, Outlet, useFetcher, useNavigate } from 'react-router';
import { AppSidebar } from '~/components/app-sidebar';
import { CharacterItem } from '~/components/character-item';
import { ModeToggle } from '~/components/mode-toggle';
import { NavUser } from '~/components/nav-user';
import { Button } from '~/components/ui/button';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import { useIsNavigating, useProfileData } from '~/lib/hooks';

import type { Route } from './+types/sidebar';

export default function Sidebar({ params }: Route.ComponentProps) {
  const { submit } = useFetcher();
  const { characterId } = params;
  const response = useProfileData();
  const navigate = useNavigate();
  const [isNavigating] = useIsNavigating();

  if (response.type === 'error') {
    return <Outlet />;
  }
  if (response.type === 'owner' || response.type === 'viewer') {
    const { profile, isSignedIn, type, auth } = response;
    const isOwner = type === 'owner';
    const canReturnBack = isSignedIn && auth.id !== profile.id;
    const characters = profile.characters;
    const data = {
      base: [
        {
          name: isOwner ? 'Home' : `${profile.displayName}'s Profile`,
          url: `/profile/${profile.id}/c/${characterId}`,
          icon: Home,
        },
      ],
      projects: [
        {
          name: 'Sessions',
          url: `/profile/${profile.id}/c/${characterId}/sessions`,
          icon: Hourglass,
        },
        {
          name: 'Loadouts',
          url: `/profile/${profile.id}/c/${characterId}/loadouts`,
          icon: SquareLibrary,
        },
        isOwner
          ? {
              name: 'Fireteam',
              url: `/profile/${profile.id}/c/${characterId}/fireteam`,
              icon: UsersRound,
            }
          : undefined,
      ].filter((x) => !!x),
    };
    return (
      <SidebarProvider>
        <AppSidebar
          navigationData={data}
          header={
            <div className="flex flex-col justify-center gap-2 p-4">
              <h1 className="text-2xl font-bold tracking-tight">
                D2 One Trick
              </h1>
              {canReturnBack && (
                <Button asChild variant="ghost">
                  <Link to={`/profile/${auth.id}`}>Return to your profile</Link>
                </Button>
              )}
            </div>
          }
          footer={
            isOwner && (
              <NavUser
                displayName="Settings"
                onLogout={() =>
                  submit(null, {
                    method: 'post',
                    action: '/action/logout',
                  }).catch(console.error)
                }
              />
            )
          }
        />
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
            <div className="flex flex-col gap-12">
              <div className="flex w-full flex-col justify-stretch gap-6 md:flex-row">
                {characters?.map((character) => (
                  <Link
                    to={`/profile/${profile.id}/c/${character.id}`}
                    className="w-full"
                  >
                    <CharacterItem
                      character={character}
                      isChecked={characterId === character.id}
                    />
                  </Link>
                ))}
              </div>

              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }
  console.error('Unknown response type:', response);
  return <Outlet />;
}
