import React, { useEffect } from 'react';
import { useFetcher } from 'react-router';
import type { CharacterSnapshot } from '~/api';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

interface MergeLoadoutDialogProps {
  baseSnapshot: CharacterSnapshot | null;
  availableSnapshots: CharacterSnapshot[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MergeLoadoutDialog({
  baseSnapshot,
  availableSnapshots,
  isOpen,
  onOpenChange,
}: MergeLoadoutDialogProps) {
  const fetcher = useFetcher<{ ok: boolean }>();

  const isSubmitting = fetcher.state === 'submitting';

  // Effect to close the modal on successful submission
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.ok) {
      onOpenChange(false);
    }
  }, [fetcher.state, fetcher.data, onOpenChange]);

  if (!baseSnapshot) {
    return null;
  }

  // Filter out the base snapshot from the list of available snapshots to merge
  const otherSnapshots = availableSnapshots.filter(
    (s) => s.id !== baseSnapshot.id,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge with {baseSnapshot.name}</DialogTitle>
          <DialogDescription>
            Select another loadout to merge into this one. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <fetcher.Form method="post" action="/action/merge-loadout">
          {/* Hidden input to pass the base loadout ID */}
          <input type="hidden" name="baseLoadoutId" value={baseSnapshot.id} />

          <Select name="targetLoadoutId" required>
            <SelectTrigger>
              <SelectValue placeholder="Select a loadout to merge..." />
            </SelectTrigger>
            <SelectContent>
              {otherSnapshots.map((snapshot) => (
                <SelectItem key={snapshot.id} value={snapshot.id}>
                  {snapshot.name}
                </SelectItem>
              ))}
              {otherSnapshots.length === 0 && (
                <SelectItem value="none" disabled>
                  No other loadouts to merge
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <DialogFooter className="mt-4 flex flex-row justify-end gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Merging...' : 'Confirm Merge'}
            </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
