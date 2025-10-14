import { type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar';

export function NavProjects({
  projects,
  label,
}: {
  projects: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
  label?: string;
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            {/* Find a way in the future to not need this */}
            <SidebarMenuButton asChild suppressHydrationWarning={true}>
              <NavLink
                to={item.url}
                className={({ isActive, isPending }) =>
                  isPending ? 'pending' : isActive ? 'active' : ''
                }
              >
                <item.icon />
                {item.name}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
