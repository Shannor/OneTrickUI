import { Outlet } from 'react-router';
import { TooltipProvider } from '~/components/ui/tooltip';

export default function Basic() {
  return (
    <div>
      <TooltipProvider>
        <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-1 flex-col items-center justify-center overflow-y-auto p-6 2xl:p-6">
          <Outlet />
        </div>
      </TooltipProvider>
    </div>
  );
}
