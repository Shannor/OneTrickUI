import {
  Activity,
  ArrowLeftFromLine,
  Gamepad2,
  Home,
  Hourglass,
  Loader2,
  LogIn,
  SquareLibrary,
  UsersRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useFetcher, useNavigate, useParams } from 'react-router';
import { AppSidebar } from '~/components/app-sidebar';
import { ChangelogModal } from '~/components/changelog-modal';
import { Logo } from '~/components/logo';
import { ModeToggle } from '~/components/mode-toggle';
import { NavUser } from '~/components/nav-user';
import { buttonVariants } from '~/components/ui/button';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import {
  useIsNavigating,
  useOptionalProfileData,
  useRootData,
} from '~/hooks/use-route-loaders';
import { Logger } from '~/lib/logger';
import { cn } from '~/lib/utils';
import type { RootUser } from '~/root';

function getUserDisplayName(
  signedInUser: RootUser | null | undefined,
  profileResponse: ReturnType<typeof useOptionalProfileData>,
): string {
  if (signedInUser?.displayName) {
    return signedInUser.displayName;
  }
  if (signedInUser?.name) {
    return signedInUser.name;
  }
  if (profileResponse?.profile?.displayName) {
    return profileResponse.profile.displayName;
  }
  return 'Guardian';
}

function getUserCharacters(
  signedInUser: RootUser | null | undefined,
  profileResponse: ReturnType<typeof useOptionalProfileData>,
): Array<{ id: string }> {
  if (signedInUser?.characters && signedInUser.characters.length > 0) {
    return signedInUser.characters;
  }
  return profileResponse?.profile?.characters ?? [];
}

export function Sidebar() {
  const { submit } = useFetcher();
  const params = useParams();
  const { characterId } = params;
  const profileResponse = useOptionalProfileData();
  const rootData = useRootData();
  const navigate = useNavigate();
  const [isNavigating] = useIsNavigating();

  const signedInUser = rootData?.user;
  const isSignedIn = Boolean(
    signedInUser || (profileResponse && profileResponse.isSignedIn),
  );

  const signedInUserId =
    signedInUser?.id ||
    (profileResponse?.auth ? profileResponse.auth.id : undefined);

  // Active character state cached in localStorage for returning from home/public views
  const [cachedCharId, setCachedCharId] = useState<string | null>(null);

  useEffect(() => {
    if (signedInUserId) {
      if (characterId && profileResponse?.type === 'owner') {
        try {
          localStorage.setItem(
            `onetrick_active_char_${signedInUserId}`,
            characterId,
          );
          setCachedCharId(characterId);
        } catch (err) {
          Logger.error(err, 'Failed to save active character in localStorage');
        }
      } else {
        try {
          const stored = localStorage.getItem(
            `onetrick_active_char_${signedInUserId}`,
          );
          if (stored) {
            setCachedCharId(stored);
          }
        } catch (err) {
          Logger.error(err, 'Failed to get active character from localStorage');
        }
      }
    }
  }, [characterId, signedInUserId, profileResponse?.type]);

  // Determine user characters
  const userCharacters = getUserCharacters(signedInUser, profileResponse);

  const defaultCharacterId = userCharacters[0]?.id;

  // Active character ID for signed-in user's own profile routes
  const activeUserCharacterId =
    (profileResponse?.type === 'owner' && characterId) ||
    cachedCharId ||
    defaultCharacterId;

  const userDisplayName = getUserDisplayName(signedInUser, profileResponse);

  const baseNav = [
    {
      name: 'Home',
      title: 'Home',
      url: '/',
      icon: Home,
    },
    {
      name: 'Sessions',
      title: 'Sessions',
      url: '/sessions',
      icon: Activity,
    },
  ];

  let projectsNav: Array<{
    name: string;
    title: string;
    url: string;
    icon: typeof Home;
  }> = [];

  let friendsNav: Array<{
    name: string;
    title: string;
    url: string;
    icon: typeof Home;
  }> = [];

  const isInspectingOther =
    profileResponse &&
    profileResponse.type === 'viewer' &&
    signedInUserId &&
    profileResponse.profile.id !== signedInUserId;

  if (isInspectingOther && characterId) {
    // Viewing another player's profile
    const { profile } = profileResponse;
    projectsNav = [
      {
        name: `${profile.displayName}'s Overview`,
        title: `${profile.displayName}'s Overview`,
        url: `/profile/${profile.id}/c/${characterId}`,
        icon: Gamepad2,
      },
      {
        name: 'Sessions',
        title: 'Sessions',
        url: `/profile/${profile.id}/c/${characterId}/sessions`,
        icon: Hourglass,
      },
      {
        name: 'Loadouts',
        title: 'Loadouts',
        url: `/profile/${profile.id}/c/${characterId}/loadouts`,
        icon: SquareLibrary,
      },
    ];

    if (signedInUserId) {
      const returnUrl = activeUserCharacterId
        ? `/profile/${signedInUserId}/c/${activeUserCharacterId}`
        : `/profile/${signedInUserId}`;
      friendsNav = [
        {
          name: 'Return to My Profile',
          title: 'Return to My Profile',
          url: returnUrl,
          icon: ArrowLeftFromLine,
        },
      ];
    }
  } else if (signedInUserId) {
    // Signed-in user view (on public page OR own profile)
    const baseUrl = activeUserCharacterId
      ? `/profile/${signedInUserId}/c/${activeUserCharacterId}`
      : `/profile/${signedInUserId}`;

    projectsNav = [
      {
        name: 'Overview',
        title: 'Overview',
        url: baseUrl,
        icon: Gamepad2,
      },
      {
        name: 'My Sessions',
        title: 'My Sessions',
        url: activeUserCharacterId
          ? `${baseUrl}/sessions`
          : `/profile/${signedInUserId}`,
        icon: Hourglass,
      },
      {
        name: 'Loadouts',
        title: 'Loadouts',
        url: activeUserCharacterId
          ? `${baseUrl}/loadouts`
          : `/profile/${signedInUserId}`,
        icon: SquareLibrary,
      },
    ];

    friendsNav = [
      {
        name: 'Fireteam',
        title: 'Fireteam',
        url: activeUserCharacterId
          ? `${baseUrl}/fireteam`
          : `/profile/${signedInUserId}`,
        icon: UsersRound,
      },
    ];
  }

  const navigationData = {
    base: baseNav,
    projects: projectsNav,
    friends: friendsNav,
  };

  return (
    <SidebarProvider>
      <AppSidebar
        navigationData={navigationData}
        headerProps={{
          onClick: () => navigate(`/`),
        }}
        header={
          <div className="flex w-full flex-row items-center gap-4">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Logo className="h-10 w-auto" alt="D2 One Trick logo" />
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-lg font-bold">
                <span className="text-primary">1</span>
                Trick
              </span>
            </div>
          </div>
        }
        footer={
          isSignedIn ? (
            <NavUser
              displayName={userDisplayName}
              onLogout={() =>
                submit(null, {
                  method: 'post',
                  action: '/action/logout',
                }).catch((err) => Logger.error(err, 'Logout failed'))
              }
            />
          ) : (
            <div className="p-2">
              <Link
                to="/login"
                className={cn(
                  buttonVariants({ variant: 'default', size: 'sm' }),
                  'w-full justify-center gap-2 font-semibold',
                )}
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            </div>
          )
        }
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 md:h-16">
          <div className="flex items-center gap-2 px-2.5 sm:px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
          <div className="flex items-center gap-2 px-2.5 sm:px-4">
            <ChangelogModal />
            <ModeToggle />
          </div>
        </header>
        <div className="relative flex w-full flex-1 flex-col overflow-y-auto px-2.5 pb-4 sm:px-6 xl:mx-auto 2xl:max-w-[1440px] 2xl:p-6">
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
    </SidebarProvider>
  );
}

export default Sidebar;
