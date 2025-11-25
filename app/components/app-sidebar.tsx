import { type LucideIcon } from 'lucide-react';
import * as React from 'react';
import { NavProjects } from '~/components/nav-projects';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '~/components/ui/sidebar';

// Navigation item type

// Navigation item type
type NavigationItem = {
  name: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  title: string;
};

// Navigation data type
type NavigationData = {
  base: NavigationItem[];
  projects: NavigationItem[];
  friends: NavigationItem[];
};
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navigationData: NavigationData;
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  headerProps?: React.ComponentProps<typeof SidebarMenuButton>;
}
export function AppSidebar({
  children,
  navigationData,
  header,
  headerProps,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              {...headerProps}
            >
              {header}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={navigationData.base} />
        <NavProjects projects={navigationData.projects} label="Tracking" />
        <NavProjects projects={navigationData.friends} label="Guardians" />
      </SidebarContent>
      <SidebarFooter>{props.footer}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
