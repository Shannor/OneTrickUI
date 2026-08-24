import { Activity, ArrowLeft, Home } from 'lucide-react';
import { useEffect } from 'react';
import { Link, isRouteErrorResponse } from 'react-router';
import { Button, buttonVariants } from '~/components/ui/button';
import { trackError } from '~/lib/tracking';
import { cn } from '~/lib/utils';

export interface ErrorBoundaryContentProps {
  error?: unknown;
}

export function ErrorBoundaryContent({ error }: ErrorBoundaryContentProps) {
  useEffect(() => {
    trackError(error);
  }, [error]);

  const is404 = isRouteErrorResponse(error)
    ? error.status === 404
    : typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status: number }).status === 404
      : false;

  let errorMessage = is404
    ? "The page, session, or Guardian profile you are looking for doesn't exist or has been moved."
    : "Oops! Sorry Guardian, we're working on it!";

  if (import.meta.env.DEV && error && error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full flex-col items-center justify-center p-4 text-center sm:p-8">
      <div className="relative flex w-full max-w-lg flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/80 p-8 shadow-xl backdrop-blur-md sm:p-12">
        {/* Large 404 / Error Graphic */}
        <div className="mb-2 flex items-center justify-center">
          <span className="select-none text-8xl font-black leading-none tracking-tighter text-primary/30 drop-shadow-md dark:text-primary/25 sm:text-9xl md:text-[10rem]">
            {is404 ? '404' : 'ERR'}
          </span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {is404 ? 'Page Not Found' : 'Something Went Wrong'}
        </h1>

        <p className="mt-3 max-w-md text-balance text-sm text-muted-foreground sm:text-base">
          {errorMessage}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            to="/"
            className={cn(
              buttonVariants({ variant: 'default', size: 'lg' }),
              'w-full justify-center gap-2 font-semibold sm:w-auto sm:min-w-[140px]',
            )}
          >
            <Home className="h-4 w-4" />
            <span>Go to Home</span>
          </Link>

          <Link
            to="/active-sessions"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'w-full justify-center gap-2 font-medium sm:w-auto sm:min-w-[140px]',
            )}
          >
            <Activity className="h-4 w-4 text-primary" />
            <span>Active Feeds</span>
          </Link>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.history.back();
            }
          }}
          className="mt-4 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Go Back to Previous Page</span>
        </Button>
      </div>
    </div>
  );
}
