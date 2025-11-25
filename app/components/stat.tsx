import React from 'react';
import { Label } from '~/components/label';
import { cn } from '~/lib/utils';

interface Props {
  label: string;
  value: string;
  valueClassName?: string;
  labelClassName?: string;
}

export const Stat: React.FC<Props> = ({
  label,
  value,
  labelClassName,
  valueClassName,
}) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <Label className={labelClassName}>{label}</Label>
      <h4
        className={cn('text-xl font-semibold tracking-tight', valueClassName)}
      >
        {value}
      </h4>
    </div>
  );
};
