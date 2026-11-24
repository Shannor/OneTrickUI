import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFetcher } from 'react-router';
import type { CharacterSnapshot } from '~/api';
import { LoadingButton } from '~/components/loading-button';
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
import { toast } from '~/components/ui/sonner';
import { areSnapshotsCompatible } from '~/hooks/use-loadout';

interface MergeLoadoutDialogProps {
  baseSnapshot: CharacterSnapshot | null;
  availableSnapshots: CharacterSnapshot[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MergeLoadoutDialogContentProps {
  baseSnapshot: CharacterSnapshot;
  availableSnapshots: CharacterSnapshot[];
  onOpenChange: (open: boolean) => void;
}

function MergeLoadoutDialogContent({
  baseSnapshot,
  availableSnapshots,
  onOpenChange,
}: MergeLoadoutDialogContentProps) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const previousState = useRef(fetcher.state);

  const isMerging = fetcher.state !== 'idle';

  useEffect(() => {
    if (
      previousState.current !== 'idle' &&
      fetcher.state === 'idle' &&
      fetcher.data?.ok
    ) {
      toast.success('Loadouts merged successfully');
      onOpenChange(false);
    }
    previousState.current = fetcher.state;
  }, [fetcher.state, fetcher.data, onOpenChange]);

  const compatibleSnapshots = availableSnapshots.filter((s) =>
    areSnapshotsCompatible(baseSnapshot, s),
  );

  const errorMessage =
    fetcher.state === 'idle' && fetcher.data?.ok === false
      ? fetcher.data.error
      : undefined;

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (isMerging) return;
        onOpenChange(open);
      }}
    >
      <DialogContent
        onEscapeKeyDown={(e) => {
          if (isMerging) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isMerging) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Merge with {baseSnapshot.name}</DialogTitle>
          <DialogDescription>
            Select another compatible loadout to merge into this one. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <fetcher.Form method="post" action="/action/merge-loadout">
          <input type="hidden" name="baseLoadoutId" value={baseSnapshot.id} />

          <Select
            name="sourceSnapshotIds"
            value={selectedSourceId}
            onValueChange={setSelectedSourceId}
            required
            disabled={isMerging}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a loadout to merge..." />
            </SelectTrigger>
            <SelectContent>
              {compatibleSnapshots.map((snapshot) => (
                <SelectItem key={snapshot.id} value={snapshot.id}>
                  {snapshot.name}
                </SelectItem>
              ))}
              {compatibleSnapshots.length === 0 && (
                <SelectItem value="none" disabled>
                  No compatible loadouts to merge
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {isMerging && (
            <div
              role="status"
              aria-live="polite"
              data-testid="merge-progress-banner"
              className="mt-3 flex items-center gap-2.5 rounded-md border border-primary/40 bg-primary/10 p-2.5 text-xs text-foreground"
            >
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              <span>
                {fetcher.state === 'loading'
                  ? 'Refreshing session loadouts...'
                  : 'Merging loadouts and updating match history...'}
              </span>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="mt-3 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <DialogFooter className="mt-4 flex flex-row justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              disabled={isMerging}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              disabled={
                isMerging ||
                compatibleSnapshots.length === 0 ||
                !selectedSourceId
              }
              isLoading={isMerging}
              loadingText={
                fetcher.state === 'loading' ? 'Refreshing...' : 'Merging...'
              }
            >
              Confirm Merge
            </LoadingButton>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}

export function MergeLoadoutDialog({
  baseSnapshot,
  availableSnapshots,
  isOpen,
  onOpenChange,
}: MergeLoadoutDialogProps) {
  if (!isOpen || !baseSnapshot) {
    return null;
  }

  return (
    <MergeLoadoutDialogContent
      key={baseSnapshot.id}
      baseSnapshot={baseSnapshot}
      availableSnapshots={availableSnapshots}
      onOpenChange={onOpenChange}
    />
  );
}
