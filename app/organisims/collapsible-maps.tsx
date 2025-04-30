import { format } from 'date-fns';
import { ChevronsDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Aggregate } from '~/api';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';

interface MapProps {
  aggregates: Aggregate[];
}
export function CollapsibleMaps({ aggregates }: MapProps) {
  const sorted = aggregates
    .slice() // Create a shallow copy to avoid mutating the original array
    .sort(
      (a, b) =>
        new Date(a.activityDetails.period).getTime() -
        new Date(b.activityDetails.period).getTime(),
    );
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
        <div className="flex flex-row items-center gap-1 px-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronsDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
          <h4 className="font-semibold">Maps Played: {sorted.length}</h4>
        </div>
        <CollapsibleContent className="space-y-2 px-6">
          {sorted.map((aggregate) => {
            const { period, location, imageUrl } = aggregate.activityDetails;
            return (
              <div
                key={aggregate.id}
                className="flex cursor-pointer flex-row items-center gap-2"
                onClick={() => {
                  navigate(`/activities/${aggregate.activityId}`);
                }}
              >
                <Avatar className="rounded-sm opacity-75">
                  <AvatarImage src={imageUrl} alt={`${location} image`} />
                  <AvatarFallback>{location.at(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <div>{location}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(period, 'MM/dd/yyyy - p')}
                  </div>
                </div>
              </div>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
      <div className="flex flex-col gap-4"></div>
    </div>
  );
}
