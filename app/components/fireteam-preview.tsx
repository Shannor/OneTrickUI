import * as React from 'react';
import { Label } from '~/components/label';
import { Avatar, AvatarImage } from '~/components/ui/avatar';
import { cn } from '~/lib/utils';

type CharacterData = {
  id: string;
  emblemURL: string;
  emblemColor: { red: number; green: number; blue: number; alpha: number };
};

type UserCharacters = {
  membershipId: string;
  characters: CharacterData[];
};

type FireteamMember = {
  id: string;
  membershipId: string;
  displayName: string;
};

type FireteamResult =
  | { status: 'error'; error: string }
  | {
      status: 'success';
      fireteam: FireteamMember[];
      selectedCharacters?: Record<string, string>;
      charactersPromise: Promise<UserCharacters[]>;
    };

export function FireteamPreview({
  fireteamPromise,
}: {
  fireteamPromise: Promise<FireteamResult>;
}) {
  const response = React.use(fireteamPromise);
  if (response.status === 'error') {
    return <div></div>;
  }

  const { fireteam, selectedCharacters, charactersPromise } = response;
  const characters = React.use(charactersPromise);

  const membershipToCharacters = characters.reduce<
    Record<string, UserCharacters>
  >((state, current) => {
    state[current.membershipId] = current;
    return state;
  }, {});

  return (
    <div className="flex flex-col gap-1">
      <Label>Fireteam</Label>
      <div className="flex cursor-default flex-col gap-2">
        {fireteam.length === 0 && (
          <div className="text-center">Currently Offline...</div>
        )}
        {fireteam.map((m) => {
          const characterId =
            selectedCharacters?.[m.id] ?? selectedCharacters?.[m.membershipId];
          const character = membershipToCharacters[
            m.membershipId
          ]?.characters.find((it) => it.id === characterId);

          if (!character) {
            return (
              <div key={m.id} className="w-full p-4 dark:bg-gray-400">
                {m.displayName}
              </div>
            );
          }
          const { red, green, blue, alpha } = character.emblemColor;
          return (
            <div
              key={m.id}
              style={{
                backgroundColor: `rgba(${red}, ${green}, ${blue}, ${alpha})`,
              }}
              className={cn(
                `flex h-8 flex-row items-center gap-3 rounded-[4px]`,
              )}
            >
              <Avatar className="h-8 w-8 rounded-[4px]">
                <AvatarImage src={character.emblemURL} />
              </Avatar>
              <h2 className="text-md text-white">{m.displayName}</h2>
            </div>
          );
        })}
      </div>
    </div>
  );
}
