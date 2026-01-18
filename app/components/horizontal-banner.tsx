import React from 'react';
import { cn } from '~/lib/utils';

interface Props {
  label: string;
  className?: string;
}
export const HorizontalBanner = ({ label, className }: Props) => {
  return (
    <div
      className={cn(
        'flex h-4 w-full items-center justify-center rounded p-2',
        className,
      )}
    >
      <div className="flex w-full flex-row items-center justify-center text-sm tracking-[1rem]">
        {label.toUpperCase()}
      </div>
    </div>
  );
};
