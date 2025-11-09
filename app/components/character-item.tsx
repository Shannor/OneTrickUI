import React, { type FC } from 'react';
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
    <label className={cn('w-full')}>
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
          height: 75,
        }}
        className={cn(
          'flex flex-row justify-between p-2 pl-20 align-middle',
          !isChecked &&
            'cursor-pointer drop-shadow-md grayscale transition-all hover:drop-shadow-xl hover:filter-none dark:hover:border-2 dark:hover:border-yellow-200',
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
  );
};
