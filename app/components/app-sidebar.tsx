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
      url: '/',
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
          url: '/activities',
        },
        {
          title: 'Competitive',
          url: '/activities?type=competitive',
        },
        {
          title: 'Quick Play',
          url: '/activities?type=quickplay',
        },
        {
          title: 'Iron Banner',
          url: '/activities?type=ironBanner',
        },
      ],
    },
  ],
  projects: [
    {
      name: 'Sessions',
      url: '/sessions',
      icon: Hourglass,
    },
    {
      name: 'Loadouts',
      url: '/loadouts',
      icon: SquareLibrary,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  profile: Profile;
  onChangeCharacter: (characterId: string) => void;
  currentCharacterId?: string;
}
export function AppSidebar({
  profile,
  onChangeCharacter,
  currentCharacterId,
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
        <NavUser user={profile} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
