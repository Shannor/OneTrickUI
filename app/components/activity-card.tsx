import type { ActivityHistory } from '~/api';
import { FormattedDate } from '~/components/formatted-date';

export function ActivityCard({
  activity,
  onClick,
}: {
  activity: ActivityHistory;
  onClick: () => void;
}) {
  return (
    <div
      key={activity.instanceId}
      onClick={onClick}
      className="flex w-full cursor-pointer flex-row gap-8 p-4 transition-colors hover:bg-gray-600/10 hover:dark:bg-gray-600/10"
    >
      <img
        src={activity.imageUrl}
        className="h-auto w-36 rounded-lg object-cover"
        alt="activity image"
      />
      <div className="flex flex-col gap-4">
        <Description activity={activity.activity} mode={activity.mode} />
        <div className="flex flex-row items-center gap-2">
          <img
            src={activity.activityIcon}
            className="h-12 w-12 rounded-lg bg-black/50 object-cover"
            alt="activity image"
          />

          <div className="flex flex-col gap-2">
            <div className="text-xl font-bold">{activity.location}</div>
          </div>
        </div>
        <FormattedDate date={activity.period} />
      </div>
    </div>
  );
}

const ironBanner = 'iron banner';

function Description({ activity, mode }: { activity: string; mode?: string }) {
  if (activity.toLowerCase().includes(ironBanner)) {
    return (
      <div className="text-sm uppercase tracking-wide text-muted-foreground">
        {activity}
      </div>
    );
  }
  return (
    <div className="text-sm uppercase tracking-wide text-muted-foreground">
      {activity}
      {mode && <span>{' - ' + mode}</span>}
    </div>
  );
}
