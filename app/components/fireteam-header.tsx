import { Users } from 'lucide-react';
import { Badge } from '~/components/ui/badge';

interface FireteamHeaderProps {
  memberCount: number;
}

export function FireteamHeader({ memberCount }: FireteamHeaderProps) {
  return (
    <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Fireteam Overview
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          View your current 1 Trick fireteam, manage active Guardians, and
          monitor live tracking sessions.
        </p>
      </div>
      <Badge
        variant="secondary"
        className="w-fit shrink-0 gap-1.5 px-3 py-1 text-sm font-medium"
      >
        <Users className="h-4 w-4 text-primary" />
        {memberCount} {memberCount === 1 ? 'Teammate' : 'Teammates'}
      </Badge>
    </div>
  );
}
