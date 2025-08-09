import * as React from 'react';
import { Avatar, AvatarImage } from '~/components/ui/avatar';
import { cn } from '~/lib/utils';

import type { Route } from '../../.react-router/types/app/layouts/+types/sidebar';

export function FireteamPreview({
  p,
}: {
  p: Route.ComponentProps['loaderData']['fireteam'];
}) {
  const response = React.use(p);
  if (response.status === 'error') {
    return <div></div>;
  }
  const { fireteam, selectedCharacters, charactersPromise } = response;
  const characters = React.use(charactersPromise);
  const membershipToCharacters = characters.reduce<
    Record<string, (typeof characters)[0]>
  >((state, current) => {
    state[current.membershipId] = current;
    return state;
  }, {});
  return (
    <div className="flex cursor-default flex-col gap-2">
      {fireteam.map((m) => {
        const characterId = selectedCharacters?.[m.membershipId];
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
            className={cn(`flex h-8 flex-row items-center gap-3 rounded-[4px]`)}
          >
            <Avatar className="h-8 rounded-[4px]">
              <AvatarImage src={character.emblemURL} />
            </Avatar>
            <h2 className="text-md text-white">{m.displayName}</h2>
          </div>
        );
      })}
    </div>
  );
}
