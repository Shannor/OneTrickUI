import { Outlet } from 'react-router';
import { TooltipProvider } from '~/components/ui/tooltip';

export default function Basic() {
  return (
    <div>
      <TooltipProvider>
        <div className="flex w-full flex-1 flex-col overflow-y-auto px-6 pb-4 xl:mx-auto 2xl:max-w-[1440px] 2xl:p-6">
          <Outlet />
        </div>
      </TooltipProvider>
    </div>
  );
}
