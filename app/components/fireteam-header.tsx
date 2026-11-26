import { Users } from 'lucide-react';
import { Badge } from '~/components/ui/badge';

interface FireteamHeaderProps {
  memberCount: number;
  activeCount?: number;
}

export function FireteamHeader({
  memberCount,
  activeCount = 0,
}: FireteamHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Fireteam Overview
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          View your current 1 Trick fireteam, manage active Guardians, and
          monitor live tracking sessions.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {activeCount > 0 && (
          <Badge
            variant="outline"
            className="w-fit shrink-0 gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {activeCount} Active
          </Badge>
        )}
        <Badge
          variant="secondary"
          className="w-fit shrink-0 gap-1.5 px-3 py-1 text-sm font-medium"
        >
          <Users className="h-4 w-4 text-primary" />
          {memberCount} {memberCount === 1 ? 'Teammate' : 'Teammates'}
        </Badge>
      </div>
    </div>
  );
}
