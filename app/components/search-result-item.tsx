import {
  ArrowRight,
  Info,
  LogIn,
  Shield,
  Sparkles,
  User,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router';
import type { Character, SearchUserResult } from '~/api';
import { ShareSiteButton } from '~/components/share-site-button';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { cn, setBungieUrl } from '~/lib/utils';

export function splitBungieName(name: string): {
  baseName: string;
  discriminator?: string;
} {
  const hashIndex = name.lastIndexOf('#');
  if (hashIndex <= 0 || hashIndex === name.length - 1) {
    return { baseName: name };
  }
  return {
    baseName: name.slice(0, hashIndex),
    discriminator: name.slice(hashIndex),
  };
}

export function BungieNameDisplay({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { baseName, discriminator } = splitBungieName(name);
  return (
    <span className={cn('truncate font-semibold tracking-tight', className)}>
      <span>{baseName}</span>
      {discriminator ? (
        <span className="font-normal text-muted-foreground">
          {discriminator}
        </span>
      ) : null}
    </span>
  );
}

export function PlayerAvatar({
  iconPath,
  name,
  recorded,
}: {
  iconPath?: string;
  name: string;
  recorded: boolean;
}) {
  const resolvedUrl = setBungieUrl(iconPath);
  if (resolvedUrl) {
    const isPlatformIcon = resolvedUrl.includes('/img/theme/bungienet/icons/');
    return (
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60',
          isPlatformIcon ? 'bg-zinc-900/90 p-2' : 'bg-muted/40',
        )}
      >
        <img
          src={resolvedUrl}
          alt={`${name} icon`}
          className={cn(
            'h-full w-full',
            isPlatformIcon ? 'object-contain' : 'object-cover',
          )}
        />
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-md border',
        recorded
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'border-border bg-muted/60 text-muted-foreground',
      )}
    >
      {recorded ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
    </div>
  );
}

export function AlternateNameTags({
  names,
  excludeNames = [],
}: {
  names: string[];
  excludeNames?: string[];
}) {
  const excluded = new Set(
    excludeNames.map((n) => n.trim().toLowerCase()).filter(Boolean),
  );
  const cleanedNames = Array.from(
    new Set(names.map((n) => n.trim()).filter(Boolean)),
  ).filter((n) => !excluded.has(n.toLowerCase()));
  if (cleanedNames.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {cleanedNames.map((altName) => (
        <Badge
          key={altName}
          variant="outline"
          className="max-w-full truncate font-normal text-muted-foreground"
        >
          {altName}
        </Badge>
      ))}
    </div>
  );
}

export function CharacterQuickLink({
  userId,
  character,
}: {
  userId: string;
  character: Character;
}) {
  const emblemUrl = setBungieUrl(character.emblemURL);
  const lightLevel = character.light?.toString();

  return (
    <Link
      to={`/profile/${userId}/c/${character.id}`}
      className="inline-flex min-w-0 items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {emblemUrl ? (
        <img
          src={emblemUrl}
          alt={`${character.class} emblem`}
          className="h-5 w-5 shrink-0 rounded-sm object-cover"
        />
      ) : null}
      <span className="truncate font-semibold">{character.class}</span>
      {lightLevel ? (
        <span className="inline-flex shrink-0 items-center gap-0.5 text-amber-500 dark:text-amber-400">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          <span>{lightLevel}</span>
        </span>
      ) : null}
    </Link>
  );
}

export function RecordedPlayerResult({ result }: { result: SearchUserResult }) {
  const playerName = result.uniqueName || result.displayName;
  const userId = result.userId!;
  const defaultProfileHref = `/profile/${userId}`;
  const characters = result.characters ?? [];
  const avatarIcon = result.iconPath || characters[0]?.emblemURL;

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <PlayerAvatar iconPath={avatarIcon} name={playerName} recorded />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={defaultProfileHref}
                  className="min-w-0 text-base hover:underline sm:text-lg"
                >
                  <BungieNameDisplay name={playerName} />
                </Link>
                <Badge
                  variant="outline"
                  className="inline-flex shrink-0 items-center gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                >
                  <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Recorded on 1 Trick</span>
                </Badge>
              </div>
              <AlternateNameTags
                names={result.alternateNames ?? []}
                excludeNames={[result.displayName, result.uniqueName]}
              />
            </div>
          </div>

          <Button asChild size="sm" className="w-full shrink-0 sm:w-auto">
            <Link to={defaultProfileHref}>
              <span>View Profile</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {characters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="text-xs font-medium text-muted-foreground">
              Characters:
            </span>
            {characters.map((character) => (
              <CharacterQuickLink
                key={character.id}
                userId={userId}
                character={character}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UnrecordedPlayerResult({
  result,
  isSignedIn,
}: {
  result: SearchUserResult;
  isSignedIn: boolean;
}) {
  const playerName = result.uniqueName || result.displayName;

  return (
    <Card className="border-dashed bg-card/60">
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <PlayerAvatar
            iconPath={result.iconPath}
            name={playerName}
            recorded={false}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <BungieNameDisplay
                name={playerName}
                className="text-base sm:text-lg"
              />
              <Badge variant="secondary" className="shrink-0">
                Not Recorded
              </Badge>
            </div>
            <AlternateNameTags
              names={result.alternateNames ?? []}
              excludeNames={[result.displayName, result.uniqueName]}
            />
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-md border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground sm:text-sm">
          <Info
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          />
          <p>
            <span className="font-medium text-foreground">{playerName}</span>{' '}
            was found on Bungie, but has not started recording yet. 1 Trick only
            supports profiles for Guardians who have recorded their data in our
            system.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {isSignedIn
              ? 'Share 1 Trick to invite them to start recording their Crucible stats.'
              : 'Is this you? Sign in with Bungie to start recording.'}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isSignedIn ? (
              <ShareSiteButton
                playerName={playerName}
                variant="default"
                size="sm"
                className="w-full sm:w-auto"
              />
            ) : (
              <>
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Link to="/login">
                    <LogIn className="h-4 w-4" />
                    <span>Start Recording</span>
                  </Link>
                </Button>
                <ShareSiteButton
                  playerName={playerName}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                />
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SearchResultItem({
  result,
  isSignedIn,
}: {
  result: SearchUserResult;
  isSignedIn: boolean;
}) {
  if (result.isRecorded && result.userId) {
    return <RecordedPlayerResult result={result} />;
  }
  return <UnrecordedPlayerResult result={result} isSignedIn={isSignedIn} />;
}
