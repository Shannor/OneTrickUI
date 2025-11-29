import React from 'react';

interface BarProps {
  value: number;
  max?: number;
}

export const Bar: React.FC<BarProps> = ({ value, max = 100 }) => {
  const percentage = Math.min(Math.max(value, 0), max);
  return (
    <div className="relative h-2 w-full rounded bg-gray-600">
      <div
        className="absolute left-0 top-0 h-2 rounded-l bg-primary"
        style={{ width: `${(percentage / max) * 100}%` }}
      />
    </div>
  );
};
