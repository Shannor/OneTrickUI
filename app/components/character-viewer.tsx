import * as React from 'react';
import { Link } from 'react-router';
import type { Character } from '~/api';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar';

export function CharacterViewer({ character }: { character: Character }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link to="/character-select">
          <SidebarMenuButton size="lg" className="flex h-20 flex-col">
            <div className="flex w-full flex-row items-center gap-4">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Avatar>
                  <AvatarImage src={character.emblemURL} alt="destiny emblem" />
                  <AvatarFallback>
                    {character?.class?.at(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {character?.class}
                </span>
                <span className="truncate text-xs">
                  {character?.currentTitle}
                </span>
              </div>
              <div>
                <div className="text-yellow-500">{character?.light}</div>
              </div>
            </div>
            <div className="text-blue-300">Switch Character</div>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
