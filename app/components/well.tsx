import React from 'react';
import { cn } from '~/lib/utils';

export type WellProps = React.HTMLAttributes<HTMLDivElement>;

export function Well({ className, children, ...props }: WellProps) {
  return (
    <div
      className={cn(
        // Padding
        'px-2 py-3 sm:p-4',
        // Background: darker on light, lighter on dark
        'bg-neutral-100 dark:bg-neutral-800',
        // Optional niceties (remove if you want it totally plain)
        'rounded-md',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
