import { format } from 'date-fns';
import type { Session } from '~/api';
import { Badge } from '~/components/ui/badge';
import {
  Card,
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
      <CardHeader className="flex flex-col gap-4">
        <CardTitle className="flex flex-row items-center gap-4 text-lg">
          {!session.completedAt && session.status === 'complete' && (
            <Badge className="animate-pulse">Active</Badge>
          )}
          {session.name}
        </CardTitle>
        <CardDescription className="flex flex-col gap-2">
          <div>Games Played: {session.aggregateIds?.length ?? 0}</div>
          <div>
            {format(new Date(session.startedAt), 'MM/dd/yyyy - p')}
            {session.completedAt && ' - '}
            {session.completedAt &&
              format(new Date(session.completedAt), 'MM/dd/yyyy - p')}
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
