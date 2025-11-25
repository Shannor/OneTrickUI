import React from 'react';
import { cn } from '~/lib/utils';

interface Props {
  label: string;
  className?: string;
}
const VerticalBanner = ({ label, className }: Props) => {
  return (
    <div
      className={cn(
        'flex h-full w-4 items-center justify-center rounded p-2',
        className,
      )}
    >
      <div className="flex h-full flex-col items-center justify-center text-sm">
        {label
          .toUpperCase()
          .split('')
          .map((letter) => (
            <div key={letter}>
              {letter}
              <br />
            </div>
          ))}
      </div>
    </div>
  );
};

export default VerticalBanner;
