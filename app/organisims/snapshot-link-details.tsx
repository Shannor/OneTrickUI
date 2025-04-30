import { AlertCircle } from 'lucide-react';
import React from 'react';
import type { SnapshotLink } from '~/api';
import { Empty } from '~/components/empty';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';

export function SnapshotLinkDetails({ link }: { link?: SnapshotLink }) {
  if (!link) {
    return (
      <Empty title="No Snapshot Link" description="No snapshot link found" />
    );
  }
  switch (link.confidenceLevel) {
    case 'notFound':
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            <p>
              Couldn't find a matching snapshot for this activity. This is
              likely due to not having a matching snapshot at this time or a
              running session.
            </p>
            <p>
              To get data either take more snapshots before games or run
              sessions.
            </p>
          </AlertDescription>
        </Alert>
      );
    case 'noMatch':
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            <p>
              The system found snapshots but none of the weapons in the
              snaphost(s) matched the guns in the activity.
            </p>
          </AlertDescription>
        </Alert>
      );
    case 'low':
    case 'medium':
    case 'high':
      return (
        <Alert>
          <AlertTitle>Snapshot Found!</AlertTitle>
          <AlertDescription>
            <p>
              The system found a matching snapshot with a {link.confidenceLevel}{' '}
              level.
            </p>
          </AlertDescription>
        </Alert>
      );
    default:
      return <div>Default</div>;
  }
}
