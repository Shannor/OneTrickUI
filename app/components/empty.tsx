import { CircleAlert } from 'lucide-react';
import React from 'react';
import { cn } from '~/lib/utils';

interface EmptyProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const Empty: React.FC<EmptyProps> = ({
  title = 'No content',
  description = 'No content available yet.',
  children,
  className,
  icon,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-md border border-solid px-8 py-6',
        className,
      )}
    >
      <div className="flex flex-col gap-4 text-center">
        {icon ?? (
          <CircleAlert className="flex h-16 w-16 self-center text-gray-400" />
        )}
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
        {children}
      </div>
    </div>
  );
};
