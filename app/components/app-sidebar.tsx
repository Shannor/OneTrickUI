import * as React from 'react';
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Save,
  Settings2,
  SquareTerminal,
  Swords,
  Timer,
} from 'lucide-react';

import { NavMain } from '~/components/nav-main';
import { NavProjects } from '~/components/nav-projects';
import { NavUser } from '~/components/nav-user';
import { CharacterSwitcher } from '~/components/character-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '~/components/ui/sidebar';
import type { Profile } from '~/api';

// This is sample data.
const data = {
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
      icon: Timer,
    },
    {
      name: 'Snapshots',
      url: '/snapshots',
      icon: Save,
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
  const c = [...profile.characters].sort((a, b) => {
    if (b.light !== a.light) {
      return b.light - a.light;
    }
    return a.class.localeCompare(b.class);
  });
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <CharacterSwitcher
          characters={c}
          currentCharacterId={currentCharacterId}
          onChangeCharacter={onChangeCharacter}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={profile} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
