import { ChevronsUpDown, Plus } from 'lucide-react';
import * as React from 'react';
import type { Profile } from '~/api';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '~/components/ui/sidebar';

export function CharacterSwitcher({
  characters,
  currentCharacterId,
  onChangeCharacter,
}: {
  characters: Profile['characters'];
  currentCharacterId?: string;
  onChangeCharacter?: (characterId: string) => void;
}) {
  const { isMobile } = useSidebar();
  const currentCharacter = characters.find((c) => c.id === currentCharacterId);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Avatar>
                  <AvatarImage
                    src={currentCharacter?.emblemURL}
                    alt="@shadcn"
                  />
                  <AvatarFallback>
                    {currentCharacter?.class?.at(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {currentCharacter?.class}
                </span>
                <span className="truncate text-xs">
                  {currentCharacter?.currentTitle}
                </span>
              </div>
              <div>
                <div className="text-yellow-500">{currentCharacter?.light}</div>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Guardian
            </DropdownMenuLabel>
            {characters.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => {
                  onChangeCharacter?.(team.id);
                }}
                className="gap-6 p-4"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Avatar>
                    <AvatarImage src={team.emblemURL} alt="@shadcn" />
                    <AvatarFallback>
                      {team.class.at(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-lg font-semibold"> {team.class}</div>
                  <p className="text-sm text-yellow-500">{team.light}</p>
                </div>
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
