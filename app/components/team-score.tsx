import React from 'react';
import type { Team } from '~/api';
import { Label } from '~/components/label';

interface Props {
  teams: Team[];
}
export const TeamScore = ({ teams }: Props) => {
  const alphaId = getAlphaId(teams);
  return (
    <div className="flex flex-row gap-6">
      {teams.map((team) => {
        return (
          <div key={team.id} className="flex flex-row items-center gap-4">
            <Label
              className="text-lg font-semibold data-[result=0]:text-blue-500 data-[result=1]:text-red-500"
              data-result={alphaId === team.id ? 0 : 1}
            >
              {alphaId === team.id ? 'Alpha' : 'Bravo'}
            </Label>
            <div className="text-lg font-semibold">{team.score}</div>
          </div>
        );
      })}
    </div>
  );
};

function getAlphaId(teams: Team[]): string {
  if (teams.length !== 2) {
    return '';
  }
  const [first, second] = teams;
  const f = Number(first.id);
  const s = Number(second.id);
  return f < s ? first.id : second.id;
}
