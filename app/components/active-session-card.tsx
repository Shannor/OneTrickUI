import { formatDistance } from 'date-fns';
import { Link } from 'react-router';
import type { Profile, Session } from '~/api';
import { Stat } from '~/components/stat';
import { Badge } from '~/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export interface ActiveSessionCardProps {
  session: Session;
  profile?: Profile;
}

export function ActiveSessionCard({
  session,
  profile,
}: ActiveSessionCardProps) {
  const startTime = session.startedAt ? new Date(session.startedAt) : null;

  return (
    <Link
      to={`/profile/${session.userId}/c/${session.characterId}/sessions/${session.id}`}
      className="block text-left"
    >
      <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="truncate text-base font-semibold">
              {session.name || 'Active Session'}
            </CardTitle>
            <Badge className="shrink-0 animate-pulse bg-primary">Active</Badge>
          </div>
          {profile?.displayName && (
            <CardDescription className="truncate font-medium text-primary">
              {profile.displayName}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {session.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {session.description}
            </p>
          )}
          <Stat
            label="Games Played"
            value={(session.aggregateIds?.length ?? 0).toString()}
          />
          {startTime && (
            <div className="text-xs text-muted-foreground">
              Started{' '}
              {formatDistance(startTime, new Date(), {
                addSuffix: true,
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
