import React from 'react';
import type { Character } from '~/api';
import { cn } from '~/lib/utils';

interface Options {
  isChecked: boolean;
  shouldGrayOut: boolean;
  isCompact: boolean;
}
interface Props {
  character: Character;
  options?: Partial<Options>;
}
const CharacterPlate: React.FC<Props> = ({ character, options }) => {
  return (
    <div
      style={{
        backgroundImage: `url(${character.emblemBackgroundURL})`,
        backgroundSize: 'cover',
        height: options?.isCompact ? 45 : 75,
        filter:
          !options?.isChecked && options?.shouldGrayOut
            ? 'grayscale(100%)'
            : 'none',
      }}
      className={cn(
        'flex flex-row justify-between p-2 pl-20 align-middle',
        !options?.isChecked && 'transition-all hover:filter-none',
      )}
    >
      <div>
        <h2 className="text-lg font-semibold tracking-wider text-white">
          {character.class}
        </h2>
        <div>
          <div className="text-white">
            {character.currentTitle} - {character.race}
          </div>
        </div>
      </div>
      <div className="text-xl font-semibold text-yellow-300 drop-shadow-[0_0_2px_black]">
        {character.light}
      </div>
    </div>
  );
};

export default CharacterPlate;
