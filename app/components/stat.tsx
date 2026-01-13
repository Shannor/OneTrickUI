import React from 'react';
import { Label } from '~/components/label';
import { cn } from '~/lib/utils';

interface Props {
  label: string;
  value: string;
  valueClassName?: string;
  labelClassName?: string;
  className?: string;
}

export const Stat: React.FC<Props> = ({
  label,
  value,
  labelClassName,
  valueClassName,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-2 lg:items-center',
        className,
      )}
    >
      <Label className={labelClassName}>{label}</Label>
      <h4
        className={cn('text-xl font-semibold tracking-tight', valueClassName)}
      >
        {value}
      </h4>
    </div>
  );
};
