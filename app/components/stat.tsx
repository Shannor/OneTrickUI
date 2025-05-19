import React from 'react';
import { Label } from '~/components/label';

interface Props {
  label: string;
  value: string;
}

export const Stat: React.FC<Props> = ({ label, value }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <Label>{label}</Label>
      <h4 className="text-xl font-semibold tracking-tight">{value}</h4>
    </div>
  );
};
