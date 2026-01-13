import { format, formatDistance } from 'date-fns';
import type { Session } from '~/api';
import { Stat } from '~/components/stat';
import { Badge } from '~/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { cn } from '~/lib/utils';

export function SessionCard(props: {
  onClick: () => void | Promise<void>;
  session: Session;
  classname?: string;
}) {
  const { session, classname, onClick } = props;
  return (
    <Card className={cn('cursor-pointer', classname)} onClick={onClick}>
      <CardHeader className="flex flex-col gap-4 space-y-0">
        <CardTitle className="flex flex-row items-center gap-4 text-xl">
          {session.status === 'pending' && (
            <Badge className="animate-pulse">Active</Badge>
          )}
          {session.name}
        </CardTitle>
        {session.description && (
          <CardDescription>
            <div>{session.description}</div>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Stat
          className="lg:items-start"
          label="Games"
          value={session.aggregateIds?.length?.toString() ?? '0'}
        />
        <div className="flex flex-col gap-1">
          <div className="text-sm text-muted-foreground">
            Played for{' '}
            {session.completedAt &&
              formatDistance(
                new Date(session.startedAt),
                new Date(session.completedAt),
              )}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(session.startedAt), 'MMM d, yyyy')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
