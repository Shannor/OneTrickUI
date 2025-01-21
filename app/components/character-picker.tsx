import type { Character } from '~/api';
import { cn } from '~/lib/utils';

interface Props {
  onSubmit: (characterId: string) => void;
  characters: Character[];
  currentCharacterId?: string;
}
export function CharacterPicker({
  onSubmit,
  characters,
  currentCharacterId,
}: Props) {
  return (
    <div className="scroll-m-20 flex flex-col gap-4">
      {!currentCharacterId && (
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Pick your guardian to get started
        </h4>
      )}
      <div className="flex flex-col md:flex-row gap-4 flex-wrap justify-center">
        {characters.map((it) => (
          <div
            className={cn(
              'w-[300px]',
              it.id !== currentCharacterId &&
                'cursor-pointer drop-shadow-md hover:drop-shadow-xl dark:hover:border-2 dark:hover:border-yellow-300',
              it.id === currentCharacterId &&
                'cursor-default border-2 border-green-400',
            )}
            key={it.id}
            onClick={() => {
              onSubmit(it.id);
            }}
          >
            <div
              style={{
                backgroundImage: `url(${it.emblemBackgroundURL})`,
                backgroundSize: 'cover',
                height: 75,
              }}
              className="flex flex-row pl-20 p-2 align-middle justify-between"
            >
              <div>
                <h2 className="text-white text-lg font-semibold">{it.class}</h2>
                <div>
                  <div className="text-white">{it.currentTitle}</div>
                </div>
              </div>
              <div className="text-yellow-300 font-semibold text-xl drop-shadow-[0_0_2px_black]">
                {it.light}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
