import { RefreshCw, X } from 'lucide-react';
import { Fragment, type ReactNode, useEffect, useState } from 'react';
import type { Character } from '~/api';
import { CharacterItem } from '~/components/character-item';
import { Button } from '~/components/ui/button';

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
  const [isExpanded, setIsExpanded] = useState(!currentCharacterId);

  useEffect(() => {
    setChecked(currentCharacterId);
    if (currentCharacterId) {
      setIsExpanded(false);
    }
  }, [currentCharacterId]);

  const selectedCharacter = characters.find((c) => c.id === checked);
  const visibleCharacters =
    isExpanded || !selectedCharacter
      ? characters
      : characters.filter((c) => c.id === checked);

  const handleSelectCharacter = (it: Character) => {
    setChecked(it.id);
  };

  const handleCancelSwap = () => {
    setChecked(currentCharacterId);
    setIsExpanded(false);
  };

  return (
    <div className="flex w-full scroll-m-20 flex-col gap-4">
      <div className="flex flex-col justify-center gap-4">
        {visibleCharacters.map((it) => (
          <Fragment key={it.id}>
            {checked === it.id && (
              <>
                <input
                  hidden
                  name="emblemUrl"
                  value={it.emblemURL ?? ''}
                  readOnly
                />
                <input hidden name="class" value={it.class ?? ''} readOnly />
                <input
                  hidden
                  name="title"
                  value={it.currentTitle ?? ''}
                  readOnly
                />
                <input
                  hidden
                  name="light"
                  value={it.light?.toString() ?? ''}
                  readOnly
                />
                <input hidden name="race" value={it.race ?? ''} readOnly />
                <input
                  hidden
                  name="backgroundUrl"
                  value={it.emblemBackgroundURL ?? ''}
                  readOnly
                />
              </>
            )}
            <CharacterItem
              character={it}
              isChecked={checked === it.id}
              onClick={(c) => handleSelectCharacter(c)}
            />
          </Fragment>
        ))}
      </div>

      {(isExpanded || !currentCharacterId) &&
        children?.(checked, currentCharacterId)}

      {currentCharacterId && characters.length > 1 && (
        <>
          {isExpanded ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancelSwap}
              className="w-full gap-1 font-medium text-muted-foreground"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="w-full gap-2 font-medium"
            >
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              Swap Guardian
            </Button>
          )}
        </>
      )}
    </div>
  );
}
