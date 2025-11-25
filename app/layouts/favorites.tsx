import React from 'react';
import { Outlet } from 'react-router';
import { Label } from '~/components/label';

export default function Favorites({}) {
  return (
    <div className="flex flex-col gap-4">
      <Label>No favorites Saved Yet</Label>
      <Outlet />
    </div>
  );
}
