import React from 'react';
import { cn } from '~/lib/utils';

export const Label: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className, ...rest }) => {
  return (
    <div
      className={cn(
        'text-sm uppercase tracking-wide text-muted-foreground',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};
