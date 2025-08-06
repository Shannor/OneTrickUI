import { type ReactNode, useState } from 'react';
import type { Character } from '~/api';
import { cn } from '~/lib/utils';

interface Props {
  characters: Character[];
  currentCharacterId?: string | null;
  children?: (current?: string | null, previous?: string | null) => ReactNode;
}
export function CharacterPicker({
  characters,
  currentCharacterId,
  children,
}: Props) {
  const [checked, setChecked] = useState<string | null | undefined>(
    currentCharacterId,
  );
  return (
    <div className="flex scroll-m-20 flex-col gap-4">
      <div className="flex flex-col justify-center gap-6">
        {characters.map((it) => (
          <>
            <input readOnly hidden name="emblemUrl" value={it.emblemURL} />
            <input readOnly hidden name="class" value={it.class} />
            <input readOnly hidden name="title" value={it.currentTitle} />
            <input readOnly hidden name="light" value={it.light} />
            <input readOnly hidden name="race" value={it.race} />
            <input
              readOnly
              hidden
              name="backgroundUrl"
              value={it.emblemBackgroundURL}
            />
            <label
              className={cn(
                'w-[300px] md:w-[400px]',
                it.id !== checked &&
                  'cursor-pointer drop-shadow-md hover:drop-shadow-xl dark:hover:border-2 dark:hover:border-yellow-300',
              )}
              key={it.id}
            >
              <input
                className="pointer-events-none absolute h-0 w-0 opacity-0"
                hidden
                type="radio"
                value={it.id}
                id={it.id}
                checked={checked === it.id}
                onChange={() => setChecked(it.id)}
                name="characterId"
              />
              <div
                style={{
                  backgroundImage: `url(${it.emblemBackgroundURL})`,
                  backgroundSize: 'cover',
                  height: 75,
                  filter: it.id !== checked ? 'grayscale(100%)' : 'none',
                }}
                className={cn(
                  'flex flex-row justify-between p-2 pl-20 align-middle',
                  it.id !== checked && 'transition-all hover:filter-none',
                )}
              >
                <div>
                  <h2 className="text-lg font-semibold tracking-wider text-white">
                    {it.class}
                  </h2>
                  <div>
                    <div className="text-white">
                      {it.currentTitle} - {it.race}
                    </div>
                  </div>
                </div>
                <div className="text-xl font-semibold text-yellow-300 drop-shadow-[0_0_2px_black]">
                  {it.light}
                </div>
              </div>
            </label>
          </>
        ))}
      </div>
      {children?.(checked, currentCharacterId)}
    </div>
  );
}
