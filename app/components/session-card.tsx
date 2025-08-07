import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';
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
  return (
    <Card
      className={cn('cursor-pointer', props.classname)}
      onClick={props.onClick}
    >
      <CardHeader className="flex flex-col gap-4">
        <CardTitle className="flex flex-row items-center gap-4 text-lg">
          {!props.session.completedAt && (
            <Badge className="animate-pulse">Active</Badge>
          )}
          {props.session.name}
        </CardTitle>
        <CardDescription className="flex flex-col gap-2">
          <div>Games Played: {props.session.aggregateIds?.length ?? 0}</div>
          <div>
            {format(new Date(props.session.startedAt), 'MM/dd/yyyy - p')}
            {props.session.completedAt && ' - '}
            {props.session.completedAt &&
              format(new Date(props.session.completedAt), 'MM/dd/yyyy - p')}
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
