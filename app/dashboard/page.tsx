import { AppSidebar } from '~/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';
import { Separator } from '~/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import { Outlet, redirect, useNavigation } from 'react-router';
import { Skeleton } from '~/components/ui/skeleton';
import { ModeToggle } from '~/components/mode-toggle';
import { getAuth } from '~/routes/auth.server';
import type { Route } from '../../.react-router/types/app/+types/root';

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (!auth) {
    return redirect('/login');
  }
  return null;
}
export default function Page() {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
          <ModeToggle />
        </header>
        <div className="flex w-full flex-1 flex-col overflow-y-auto px-6 pb-4 xl:mx-auto 2xl:max-w-[1440px] 2xl:p-0">
          {isNavigating ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-[60px] w-full rounded-full" />
              <Skeleton className="h-[60px] w-full rounded-full" />
              <Skeleton className="h-[60px] w-full rounded-full" />
              <Skeleton className="h-[60px] w-full rounded-full" />
              <Skeleton className="h-[60px] w-full rounded-full" />
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
