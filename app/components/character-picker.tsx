import { Fragment, type ReactNode, useState } from 'react';
import type { Character } from '~/api';
import { CharacterItem } from '~/components/character-item';

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
    <div className="flex w-full scroll-m-20 flex-col gap-4">
      <div className="flex flex-col justify-center gap-6">
        {characters.map((it) => (
          <Fragment key={it.id}>
            <input
              type="radio"
              className="pointer-events-none absolute h-0 w-0 opacity-0"
              checked={checked === it.id}
              readOnly
              hidden
              name="emblemUrl"
              value={it.emblemURL}
            />
            <input
              className="pointer-events-none absolute h-0 w-0 opacity-0"
              type="radio"
              checked={checked === it.id}
              readOnly
              hidden
              name="class"
              value={it.class}
            />
            <input
              className="pointer-events-none absolute h-0 w-0 opacity-0"
              type="radio"
              checked={checked === it.id}
              readOnly
              hidden
              name="title"
              value={it.currentTitle}
            />
            <input
              className="pointer-events-none absolute h-0 w-0 opacity-0"
              type="radio"
              checked={checked === it.id}
              readOnly
              hidden
              name="light"
              value={it.light}
            />
            <input
              className="pointer-events-none absolute h-0 w-0 opacity-0"
              type="radio"
              checked={checked === it.id}
              readOnly
              hidden
              name="race"
              value={it.race}
            />
            <input
              className="pointer-events-none absolute h-0 w-0 opacity-0"
              type="radio"
              readOnly
              checked={checked === it.id}
              hidden
              name="backgroundUrl"
              value={it.emblemBackgroundURL}
            />
            <CharacterItem
              character={it}
              isChecked={checked === it.id}
              onClick={() => setChecked(it.id)}
            />
          </Fragment>
        ))}
      </div>
      {children?.(checked, currentCharacterId)}
    </div>
  );
}
