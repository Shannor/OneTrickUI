import type { ActivityHistory, CharacterMapping } from '~/api';
import { Label } from '~/components/label';

export function ActivityCard({
  activity,
  onClick,
  // TODO: Think about how I should show something is mapped or not. Show vs Tell(reading)
  characterMapping,
}: {
  activity: ActivityHistory;
  onClick: () => void;
  characterMapping?: CharacterMapping;
}) {
  const { personalValues } = activity;
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
        <div className="flex flex-row items-center gap-4">
          <Label
            className="text-lg font-semibold data-[result=0]:text-green-500 data-[result=1]:text-red-500"
            data-result={personalValues?.standing?.value ?? 0}
          >
            {personalValues?.standing?.displayValue}
          </Label>
        </div>
        <Stats values={personalValues} />
      </div>
    </div>
  );
}

function Description({ activity, mode }: { activity: string; mode?: string }) {
  if (activity.toLowerCase().includes('iron banner')) {
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

function Stats({ values }: { values: ActivityHistory['personalValues'] }) {
  if (!values) {
    return null;
  }
  const { kills, deaths, kd, kda, assists } = values;

  return (
    <div className="flex flex-row gap-6">
      <DisplayStat value={kills?.displayValue ?? 'N/A'} title="Kills" />
      <DisplayStat value={deaths?.displayValue ?? 'N/A'} title="Deaths" />
      <DisplayStat value={assists?.displayValue ?? 'N/A'} title="Assists" />
      <DisplayStat value={kda?.displayValue ?? 'N/A'} title="KD/A" />
      <DisplayStat value={kd?.displayValue ?? 'N/A'} title="K/D" />
    </div>
  );
}

function DisplayStat({ value, title }: { value: string; title: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Label>{title}</Label>
      <div className="font-bold">{value}</div>
    </div>
  );
}
