import { Loader2 } from 'lucide-react';
import type { NavigationScope } from '~/hooks/use-route-loaders';

export interface NavigationPendingIndicatorProps {
  scope: NavigationScope;
}

export function NavigationPendingIndicator({
  scope,
}: NavigationPendingIndicatorProps) {
  if (scope === 'idle') {
    return null;
  }

  return (
    <>
      <div
        role="progressbar"
        aria-label={
          scope === 'cross-route' ? 'Loading page' : 'Updating view'
        }
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/15"
      >
        <div className="h-full w-1/2 animate-indeterminate-progress bg-primary motion-reduce:w-full motion-reduce:animate-pulse" />
      </div>

      {scope === 'cross-route' ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 rounded-md border bg-background/80 px-4 py-3 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
