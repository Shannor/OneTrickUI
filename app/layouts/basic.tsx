import { Link, Outlet } from 'react-router';
import { ModeToggle } from '~/components/mode-toggle';
import { TooltipProvider } from '~/components/ui/tooltip';

export default function Basic() {
  return (
    <div className="flex min-h-screen flex-col">
      <TooltipProvider>
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/logo.svg"
                  alt="OneTrick logo"
                  className="block h-8 w-auto dark:hidden"
                />
                <img
                  src="/logo-white.svg"
                  alt="OneTrick logo"
                  className="hidden h-8 w-auto dark:block"
                />
              </Link>
              <span className="font-medium uppercase tracking-wider">
                1 Trick
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1">
          <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-1 flex-col items-center justify-center overflow-y-auto p-6 2xl:p-6">
            <Outlet />
          </div>
        </main>
      </TooltipProvider>
    </div>
  );
}
