import { format, formatDistance } from 'date-fns';
import {
  ArrowRight,
  CheckCircle2,
  Crosshair,
  Gamepad2,
  Radio,
  Trophy,
} from 'lucide-react';
import { Link } from 'react-router';
import type { Profile, Session } from '~/api';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { useHydrated } from '~/hooks/use-hydrated';
import { setBungieUrl } from '~/lib/utils';

export interface ActiveSessionCardProps {
  session: Session;
  profile?: Profile;
}

export function ActiveSessionCard({
  session,
  profile,
}: ActiveSessionCardProps) {
  const isHydrated = useHydrated();
  const isPending = session.status === 'pending';
  const startTime = session.startedAt ? new Date(session.startedAt) : null;
  const completedTime = session.completedAt
    ? new Date(session.completedAt)
    : null;
  const character = profile?.characters?.find(
    (c) => c.id === session.characterId,
  );

  return (
    <Link
      to={`/profile/${session.userId}/c/${session.characterId}/sessions/${session.id}`}
      className="group block h-full text-left"
    >
      <Card className="relative flex h-full flex-col overflow-hidden border transition-all duration-200 hover:border-primary hover:shadow-lg">
        {character?.emblemBackgroundURL && (
          <div
            style={{
              backgroundImage: `url(${character.emblemBackgroundURL})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            className="relative flex min-h-[5rem] w-full items-center justify-between px-5 py-3"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
            <div className="relative z-10 flex min-w-0 flex-col justify-center gap-0.5 py-1">
              <span className="truncate text-base font-extrabold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {profile?.displayName || 'Guardian'}
              </span>
              {character.currentTitle && (
                <div>
                  <span className="inline-block shrink-0 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    {character.currentTitle}
                  </span>
                </div>
              )}
            </div>
            {character.light != null && (
              <span className="relative z-10 shrink-0 text-base font-bold text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {character.light.toString()}
              </span>
            )}
          </div>
        )}

        <CardContent className="flex flex-1 flex-col justify-between space-y-4 p-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                  {session.name ||
                    (isPending ? 'Active Session' : 'Completed Session')}
                </h4>
                {character?.class ? (
                  <p className="truncate text-xs font-semibold uppercase tracking-wider text-primary">
                    {character.class}
                  </p>
                ) : profile?.displayName ? (
                  <p className="truncate text-xs font-semibold uppercase tracking-wider text-primary">
                    {profile.displayName}
                  </p>
                ) : null}
              </div>
              {isPending ? (
                <Badge className="shrink-0 animate-pulse gap-1 bg-primary text-primary-foreground">
                  <Radio className="h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="shrink-0 gap-1">
                  <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                  Completed
                </Badge>
              )}
            </div>

            {session.description && (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {session.description}
              </p>
            )}
          </div>

          <div className="space-y-2 border-t pt-3 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Gamepad2 className="h-3.5 w-3.5 text-muted-foreground" />
                Matches
              </span>
              <span className="font-heading text-lg font-bold tracking-wide text-foreground">
                {(
                  session.summary?.totalMatches ??
                  session.aggregateIds?.length ??
                  0
                ).toString()}
              </span>
            </div>

            {session.summary?.winRate != null && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                  Win Rate
                </span>
                <span className="font-heading text-lg font-bold tracking-wide text-foreground">
                  {session.summary.winRate <= 1
                    ? Math.round(session.summary.winRate * 100)
                    : Math.round(session.summary.winRate)}
                  %
                </span>
              </div>
            )}

            {session.summary?.kdRatio != null && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Crosshair className="h-3.5 w-3.5 text-muted-foreground" />
                  K/D Ratio
                </span>
                <span className="font-heading text-lg font-bold tracking-wide text-foreground">
                  {session.summary.kdRatio.toFixed(2)}
                </span>
              </div>
            )}

            {session.summary?.modesPlayed &&
              session.summary.modesPlayed.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  {session.summary.modesPlayed.slice(0, 3).map((mode) => (
                    <Badge
                      key={mode}
                      variant="secondary"
                      className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                    >
                      {mode}
                    </Badge>
                  ))}
                </div>
              )}

            {session.summary?.topWeapons &&
              session.summary.topWeapons.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                  {session.summary.topWeapons.slice(0, 3).map((w, idx) => {
                    const iconUrl = setBungieUrl(w.icon);
                    return (
                      <div
                        key={w.name || idx}
                        className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"
                      >
                        {iconUrl ? (
                          <img
                            src={iconUrl}
                            alt={w.name || 'Weapon'}
                            className="h-4 w-4 shrink-0 rounded object-cover"
                          />
                        ) : null}
                        <span className="max-w-[85px] truncate font-medium">
                          {w.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

            {isPending && startTime && (
              <div className="text-muted-foreground">
                Started{' '}
                {isHydrated
                  ? formatDistance(startTime, new Date(), {
                      addSuffix: true,
                    })
                  : format(startTime, 'MMM d, yyyy')}
              </div>
            )}

            {!isPending && completedTime && (
              <div className="text-muted-foreground">
                Completed{' '}
                {isHydrated
                  ? formatDistance(completedTime, new Date(), {
                      addSuffix: true,
                    })
                  : format(completedTime, 'MMM d, yyyy')}
              </div>
            )}

            {!isPending && !completedTime && startTime && (
              <div className="text-muted-foreground">
                Started{' '}
                {isHydrated
                  ? formatDistance(startTime, new Date(), {
                      addSuffix: true,
                    })
                  : format(startTime, 'MMM d, yyyy')}
              </div>
            )}

            <div className="flex items-center justify-end gap-1 font-medium text-primary opacity-90 transition-opacity group-hover:underline group-hover:opacity-100">
              <span>{isPending ? 'View Active Session' : 'View Session'}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
