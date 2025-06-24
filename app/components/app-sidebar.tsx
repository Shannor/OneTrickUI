import { Home, Hourglass, SquareLibrary, Swords } from 'lucide-react';
import * as React from 'react';
import type { Profile } from '~/api';
import { CharacterSwitcher } from '~/components/character-switcher';
import { NavMain } from '~/components/nav-main';
import { NavProjects } from '~/components/nav-projects';
import { NavUser } from '~/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '~/components/ui/sidebar';

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
      name: 'Search',
      url: '/dashboard/loadouts',
      icon: SquareLibrary,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  profile: Profile;
  onChangeCharacter: (characterId: string) => void;
  currentCharacterId?: string;
  onLogout: () => void;
}
export function AppSidebar({
  profile,
  onChangeCharacter,
  currentCharacterId,
  onLogout,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <CharacterSwitcher
          characters={profile.characters}
          currentCharacterId={currentCharacterId}
          onChangeCharacter={onChangeCharacter}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.base} />
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} label="Tracking" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={profile} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
