import { type LucideIcon } from 'lucide-react';
import * as React from 'react';
import { NavProjects } from '~/components/nav-projects';
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
  navigationData: NavigationData;
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}
export function AppSidebar({
  children,
  navigationData,
  header,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>{header}</SidebarHeader>
      <SidebarContent>
        {children}
        <NavProjects projects={navigationData.base} />
        <NavProjects projects={navigationData.projects} label="Tracking" />
      </SidebarContent>
      <SidebarFooter>{props.footer}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
