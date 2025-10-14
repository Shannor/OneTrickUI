import { type LucideIcon } from 'lucide-react';
import * as React from 'react';
import type { Character } from '~/api';
import { CharacterViewer } from '~/components/character-viewer';
import { NavProjects } from '~/components/nav-projects';
import { NavUser } from '~/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '~/components/ui/sidebar';

// Navigation item type
type NavigationItem = {
  name: string;
  url: string;
  icon: LucideIcon;
};

// Navigation data type
type NavigationData = {
  base: NavigationItem[];
  projects: NavigationItem[];
};
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  character: Character;
  navigationData: NavigationData;
  currentCharacterId?: string;
  displayName: string;
  onLogout: () => void;
  children: React.ReactNode;
}
export function AppSidebar({
  currentCharacterId,
  character,
  onLogout,
  displayName,
  children,
  navigationData,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <CharacterViewer character={character} />
      </SidebarHeader>
      <SidebarContent>
        {children}
        <NavProjects projects={navigationData.base} />
        <NavProjects projects={navigationData.projects} label="Tracking" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser displayName={displayName} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
