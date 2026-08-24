import type { FC } from 'react';
import type { Character } from '~/api';
import { cn } from '~/lib/utils';

interface Props {
  character: Character;
  isChecked: boolean;
  onClick?(character: Character): void;
}
export const CharacterItem: FC<Props> = ({ character, isChecked, onClick }) => {
  const it = character;
  return (
    <label className={cn('block w-full min-w-0')}>
      <input
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        hidden
        type="radio"
        value={it.id}
        id={it.id}
        checked={isChecked}
        onChange={() => onClick?.(it)}
        name="characterId"
      />
      <div
        style={{
          backgroundImage: `url(${it.emblemBackgroundURL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
        }}
        className={cn(
          'relative flex h-[75px] w-full min-w-0 flex-row items-center justify-between overflow-hidden rounded-md border-2 p-2 pl-20 pr-4 transition-all sm:pl-24',
          isChecked
            ? 'border-primary opacity-100 shadow-md grayscale-0'
            : 'contrast-90 cursor-pointer border-transparent opacity-50 grayscale hover:border-muted-foreground/40 hover:opacity-90 hover:grayscale-0',
        )}
      >
        <div className="relative z-10 my-auto flex min-w-0 flex-1 flex-col justify-center pr-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-base font-bold leading-tight tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] sm:text-lg">
              {it.class}
            </h2>
            {it.currentTitle && (
              <span className="shrink-0 rounded bg-black/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {it.currentTitle}
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-xs font-medium leading-tight text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {it.race}
          </div>
        </div>

        <div className="relative z-10 my-auto shrink-0 text-lg font-extrabold text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] sm:text-xl">
          {it.light?.toString()}
        </div>
      </div>
    </label>
  );
};
