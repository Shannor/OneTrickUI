import type { LucideIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '~/components/ui/sidebar';

export function isRouteActive(
  currentPathname: string,
  targetUrl: string,
): boolean {
  const currentPath = currentPathname.replace(/\/$/, '') || '/';
  const targetPath = targetUrl.replace(/\/$/, '') || '/';

  // Exact match required for root, public sessions, profile root, and character Overview routes
  if (
    targetPath === '/' ||
    targetPath === '/sessions' ||
    /^\/profile\/[^/]+$/.test(targetPath) ||
    /^\/profile\/[^/]+\/c\/[^/]+$/.test(targetPath)
  ) {
    return currentPath === targetPath;
  }
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

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
  const { isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();

  return (
    <SidebarGroup>
      {label && projects.length > 0 && (
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
      )}
      <SidebarMenu>
        {projects.map((item) => {
          const active = isRouteActive(location.pathname, item.url);

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                title={item.name}
                tooltip={item.name}
                isActive={active}
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              >
                <NavLink
                  to={item.url}
                  className={({ isActive: isNavActive }) =>
                    active || isNavActive
                      ? 'font-semibold text-primary'
                      : 'text-sidebar-foreground'
                  }
                >
                  <item.icon className={active ? 'text-primary' : ''} />
                  <span>{item.name}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
