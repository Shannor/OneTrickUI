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
  const character = characters.find((c) => c.id === currentCharacterId);
  return (
    <div className="flex scroll-m-20 flex-col gap-4">
      {!currentCharacterId ? (
        <h3 className="scroll-m-20 self-center text-2xl font-semibold tracking-tight">
          Pick a Guardian
        </h3>
      ) : (
        <h3 className="scroll-m-20 self-center text-2xl font-semibold tracking-tight">
          {character?.class} Selected
        </h3>
      )}
      <div className="flex flex-col justify-center gap-6">
        {characters.map((it) => (
          <div
            className={cn(
              'w-[300px] md:w-[400px]',
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
              className="flex flex-row justify-between p-2 pl-20 align-middle"
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
          </div>
        ))}
      </div>
    </div>
  );
}
