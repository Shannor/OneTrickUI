import {
  Home,
  Hourglass,
  Search,
  SquareLibrary,
  Swords,
  UsersRound,
} from 'lucide-react';
import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { Character, FireteamMember, Profile } from '~/api';
import { CharacterViewer } from '~/components/character-viewer';
import { ClientFallback } from '~/components/client-fallback';
import { FireteamPreview } from '~/components/fireteam-preview';
import { NavProjects } from '~/components/nav-projects';
import { NavUser } from '~/components/nav-user';
import { Avatar, AvatarImage } from '~/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '~/components/ui/sidebar';
import { Skeleton } from '~/components/ui/skeleton';
import { Well } from '~/components/well';

import type { Route } from '../../.react-router/types/app/layouts/+types/sidebar';

// This is sample data.
const data = {
  base: [
    {
      name: 'Home',
      url: '/dashboard',
      icon: Home,
    },
  ],
  navMain: [
    {
      title: 'Activity',
      url: '#',
      icon: Swords,
      isActive: true,
      items: [
        {
          title: 'All PvP',
          url: '/dashboard/activities',
        },
        {
          title: 'Competitive',
          url: '/dashboard/activities?type=competitive',
        },
        {
          title: 'Quick Play',
          url: '/dashboard/activities?type=quickplay',
        },
        {
          title: 'Iron Banner',
          url: '/dashboard/activities?type=ironBanner',
        },
      ],
    },
  ],
  projects: [
    {
      name: 'Sessions',
      url: '/dashboard/sessions',
      icon: Hourglass,
    },
    {
      name: 'Loadouts',
      url: '/dashboard/loadouts',
      icon: SquareLibrary,
    },
    {
      name: 'Fireteam',
      url: '/dashboard/fireteam',
      icon: UsersRound,
    },
    {
      name: 'Guardians',
      url: '/dashboard/profiles',
      icon: Search,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  character: Character;
  currentCharacterId?: string;
  fireteam: Route.ComponentProps['loaderData']['fireteam'];
  displayName: string;
  onLogout: () => void;
}
export function AppSidebar({
  currentCharacterId,
  character,
  onLogout,
  fireteam,
  displayName,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <CharacterViewer character={character} />
      </SidebarHeader>
      <SidebarContent>
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
            <FireteamPreview p={fireteam} />
          </Well>
        </ClientFallback>
        <NavProjects projects={data.base} />
        <NavProjects projects={data.projects} label="Tracking" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser displayName={displayName} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
