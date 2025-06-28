import { format } from 'date-fns';
import type { Session } from '~/api';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export function SessionCard(props: {
  onClick: () => void | Promise<void>;
  session: Session;
}) {
  return (
    <Card className="cursor-pointer" onClick={props.onClick}>
      <CardHeader className="flex flex-col gap-2">
        <CardTitle>{props.session.name}</CardTitle>
        <CardDescription>
          <div>Games Played: {props.session.aggregateIds?.length ?? 0}</div>
          <div>
            {format(new Date(props.session.startedAt), 'MM/dd/yyyy - p')}
            {' - '}
            {props.session.completedAt &&
              format(new Date(props.session.completedAt), 'MM/dd/yyyy - p')}
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
