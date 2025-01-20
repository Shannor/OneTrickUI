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
  Settings2,
  SquareTerminal,
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
  user: {
    name: 'shadcn',
    email: 'm@example.com',
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Activity',
      url: '#',
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: 'All PvP',
          url: '/activities',
        },
        {
          title: 'Competitive',
          url: '/activities',
        },
        {
          title: 'Quick Play',
          url: '/activities',
        },
      ],
    },
  ],
  projects: [
    {
      name: 'Sessions',
      url: '/sessions',
      icon: Frame,
    },
    {
      name: 'Snapshots',
      url: '/snapshots',
      icon: Frame,
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
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
