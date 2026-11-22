import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronDown } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router';
import type { Character } from '~/api';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { cn } from '~/lib/utils';

export interface CharacterSwitcherProps {
  characters: Character[];
  activeCharacterId?: string;
  buildCharacterHref: (characterId: string) => string;
}

export function getCharacterStackOrder(
  characters: Character[],
  activeCharacterId?: string,
) {
  const activeIndex = Math.max(
    0,
    characters.findIndex((character) => character.id === activeCharacterId),
  );
  const active = characters[activeIndex] ?? characters[0];
  const rotated = [
    ...characters.slice(activeIndex),
    ...characters.slice(0, activeIndex),
  ];

  return {
    active,
    inactive: rotated.slice(1),
  };
}

export interface ActiveEmblemBannerProps {
  character: Character;
  className?: string;
  rightSlot?: ReactNode;
}

export function ActiveEmblemBanner({
  character,
  className,
  rightSlot,
}: ActiveEmblemBannerProps) {
  const stackTitleOnMobile = Boolean(rightSlot);

  return (
    <div
      style={{
        backgroundImage: character.emblemBackgroundURL
          ? `url(${character.emblemBackgroundURL})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'left center',
      }}
      className={cn(
        'relative flex h-[68px] w-full min-w-0 items-center justify-between overflow-hidden rounded-md border-2 border-primary bg-zinc-900 pl-16 pr-2.5 shadow-md sm:h-[76px] sm:pl-24 sm:pr-4',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/55" />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center pr-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="shrink-0 text-base font-bold leading-tight tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:text-lg">
            {character.class}
          </h2>
          {character.currentTitle && (
            <span
              className={cn(
                'truncate rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]',
                stackTitleOnMobile && 'hidden sm:inline-block',
              )}
            >
              {character.currentTitle}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs font-medium leading-tight text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
          <span>{character.race}</span>
          {stackTitleOnMobile && character.currentTitle && (
            <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-yellow-300 sm:hidden">
              · {character.currentTitle}
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-2">
        <span className="text-lg font-extrabold tabular-nums text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:text-xl">
          {character.light?.toString()}
        </span>
        {rightSlot}
      </div>
    </div>
  );
}

export interface SwapTriggerPillProps {
  inactive: Character[];
  isOpen?: boolean;
  label?: string;
}

export function SwapTriggerPill({
  inactive,
  isOpen = false,
  label = 'Swap',
}: SwapTriggerPillProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-black/75 px-2 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:border-primary hover:bg-black/90 sm:px-2.5">
      <span className="hidden -space-x-1.5 sm:flex">
        {inactive.map((character) =>
          character.emblemURL ? (
            <img
              key={character.id}
              src={character.emblemURL}
              alt=""
              className="h-4 w-4 rounded-full border border-black/80 object-cover"
            />
          ) : null,
        )}
      </span>
      <span>{label}</span>
      <ChevronDown
        className={cn(
          'h-3.5 w-3.5 text-white/75 transition-transform duration-200',
          isOpen && 'rotate-180',
        )}
      />
    </span>
  );
}

export interface PeekCrestTabProps {
  character: Character;
  href: string;
  depth: 0 | 1;
}

export function PeekCrestTab({ character, href, depth }: PeekCrestTabProps) {
  const lightLabel = character.light?.toString() ?? '';
  const accessibleLabel = lightLabel
    ? `Switch to ${character.class} (${lightLabel})`
    : `Switch to ${character.class}`;

  return (
    <Link
      to={href}
      title={accessibleLabel}
      aria-label={accessibleLabel}
      className={cn(
        'group relative -ml-2.5 flex shrink-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-r-md border border-l-0 pl-2.5 pr-1 shadow-[inset_3px_0_6px_rgba(0,0,0,0.06)] transition-all hover:border-primary dark:shadow-none sm:-ml-3 sm:pl-3.5 sm:pr-1.5',
        depth === 0
          ? 'z-20 h-[58px] w-11 border-zinc-300/95 bg-zinc-100 dark:border-white/25 dark:bg-zinc-900 sm:h-[68px] sm:w-16 sm:hover:w-[4.5rem]'
          : 'z-10 h-[50px] w-10 border-zinc-300/85 bg-zinc-200/75 dark:border-white/15 dark:bg-zinc-900 sm:h-[60px] sm:w-14 sm:hover:w-16',
      )}
    >
      {character.emblemBackgroundURL && (
        <div
          style={{
            backgroundImage: `url(${character.emblemBackgroundURL})`,
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
          }}
          className="pointer-events-none absolute inset-0 opacity-25 transition-opacity group-hover:opacity-40 dark:opacity-100"
        />
      )}

      <div
        className={cn(
          'pointer-events-none absolute inset-0 transition-colors',
          depth === 0
            ? 'bg-white/80 group-hover:bg-white/65 dark:bg-zinc-950/70 dark:group-hover:bg-zinc-950/40'
            : 'bg-zinc-100/85 group-hover:bg-white/70 dark:bg-zinc-950/80 dark:group-hover:bg-zinc-950/45',
        )}
      />

      {character.emblemURL && (
        <img
          src={character.emblemURL}
          alt=""
          className={cn(
            'relative z-10 rounded-sm border border-zinc-300 object-cover grayscale transition-all group-hover:grayscale-0 dark:border-white/20',
            depth === 0
              ? 'h-5 w-5 sm:h-7 sm:w-7'
              : 'h-[18px] w-[18px] sm:h-6 sm:w-6',
          )}
        />
      )}

      <span
        className={cn(
          'relative z-10 text-[10px] font-extrabold tabular-nums transition-colors sm:text-xs',
          depth === 0
            ? 'text-zinc-700 group-hover:text-amber-600 dark:text-white/85 dark:group-hover:text-yellow-300'
            : 'text-zinc-600 group-hover:text-amber-600 dark:text-white/70 dark:group-hover:text-yellow-300',
        )}
      >
        {lightLabel}
      </span>
    </Link>
  );
}

export interface GuardianSwapMenuListProps {
  characters: Character[];
  activeId: string;
  buildCharacterHref: (id: string) => string;
  onSelect?: () => void;
}

export function GuardianSwapMenuList({
  characters,
  activeId,
  buildCharacterHref,
  onSelect,
}: GuardianSwapMenuListProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Switch Guardian</span>
        <span>
          {characters.length}{' '}
          {characters.length === 1 ? 'Guardian' : 'Guardians'}
        </span>
      </div>
      {characters.map((character) => {
        const isCurrent = character.id === activeId;
        return (
          <Link
            key={character.id}
            to={buildCharacterHref(character.id)}
            onClick={onSelect}
            className={cn(
              'group relative flex items-center justify-between overflow-hidden rounded-md border px-2.5 py-2 transition-all',
              isCurrent
                ? 'shadow-xs border-primary/70 bg-primary/[0.07] dark:border-primary/80 dark:bg-zinc-900'
                : 'border-border/80 bg-muted/45 hover:border-primary/50 hover:bg-muted/85 dark:border-border/60 dark:bg-zinc-900',
            )}
          >
            {character.emblemBackgroundURL && (
              <div
                style={{
                  backgroundImage: `url(${character.emblemBackgroundURL})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'right center',
                }}
                className="pointer-events-none absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30 dark:opacity-100"
              />
            )}

            <div
              className={cn(
                'pointer-events-none absolute inset-0 transition-colors',
                isCurrent
                  ? 'via-white/82 to-white/72 bg-gradient-to-r from-white/90 dark:from-zinc-950/60 dark:via-zinc-950/60 dark:to-zinc-950/60'
                  : 'from-white/92 via-white/88 bg-gradient-to-r to-white/80 group-hover:to-white/70 dark:from-zinc-950/80 dark:via-zinc-950/80 dark:to-zinc-950/80 dark:group-hover:bg-zinc-950/60',
              )}
            />

            <div className="relative z-10 flex min-w-0 items-center gap-2.5">
              {character.emblemURL && (
                <img
                  src={character.emblemURL}
                  alt=""
                  className={cn(
                    'h-8 w-8 shrink-0 rounded border object-cover transition-all',
                    isCurrent
                      ? 'shadow-xs border-primary/50'
                      : 'border-border/80 grayscale group-hover:grayscale-0 dark:border-white/15',
                  )}
                />
              )}
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 text-sm font-bold text-foreground dark:text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    {character.class}
                  </span>
                  {character.currentTitle && (
                    <span
                      className={cn(
                        'truncate rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
                        isCurrent
                          ? 'bg-amber-500/15 text-amber-800 dark:bg-black/65 dark:text-yellow-300'
                          : 'bg-foreground/[0.07] text-muted-foreground dark:bg-black/65 dark:text-yellow-300',
                      )}
                    >
                      {character.currentTitle}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground dark:text-white/75">
                  {character.race}
                </span>
              </div>
            </div>

            <div className="relative z-10 flex shrink-0 items-center gap-2 pl-2">
              <span
                className={cn(
                  'text-sm font-extrabold tabular-nums',
                  isCurrent
                    ? 'text-amber-600 dark:text-yellow-300 dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]'
                    : 'text-foreground/80 group-hover:text-amber-600 dark:text-yellow-300 dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]',
                )}
              >
                {character.light?.toString()}
              </span>
              {isCurrent && <Check className="h-4 w-4 text-primary" />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function CharacterSwitcher({
  characters,
  activeCharacterId,
  buildCharacterHref,
}: CharacterSwitcherProps) {
  const [open, setOpen] = useState(false);
  const { active, inactive } = getCharacterStackOrder(
    characters,
    activeCharacterId,
  );

  if (!active) {
    return null;
  }

  return (
    <div className="w-full sm:max-w-2xl">
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative flex w-full items-center">
          <PopoverPrimitive.Anchor asChild>
            <div className="relative z-30 min-w-0 flex-1">
              <ActiveEmblemBanner
                character={active}
                rightSlot={
                  inactive.length > 0 ? (
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label="Swap Guardian"
                        className="ml-0.5 focus:outline-none sm:ml-1"
                      >
                        <SwapTriggerPill inactive={inactive} isOpen={open} />
                      </button>
                    </PopoverTrigger>
                  ) : null
                }
              />
            </div>
          </PopoverPrimitive.Anchor>

          {inactive[0] && (
            <PeekCrestTab
              character={inactive[0]}
              href={buildCharacterHref(inactive[0].id)}
              depth={0}
            />
          )}

          {inactive[1] && (
            <PeekCrestTab
              character={inactive[1]}
              href={buildCharacterHref(inactive[1].id)}
              depth={1}
            />
          )}
        </div>

        {inactive.length > 0 && (
          <PopoverContent
            align="end"
            sideOffset={6}
            className="w-[var(--radix-popover-trigger-width)] border-border/90 p-2 shadow-lg sm:w-80"
          >
            <GuardianSwapMenuList
              characters={characters}
              activeId={active.id}
              buildCharacterHref={buildCharacterHref}
              onSelect={() => setOpen(false)}
            />
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}
