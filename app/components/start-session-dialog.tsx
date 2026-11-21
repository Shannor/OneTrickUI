import { PlusIcon, SwordsIcon } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useFetcher } from 'react-router';
import { LoadingButton } from '~/components/loading-button';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { cn } from '~/lib/utils';

export interface StartSessionDialogProps {
  characterId?: string;
  userId?: string;
  redirectTo?: string;
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
  triggerClassName?: string;
  trigger?: React.ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StartSessionDialog({
  characterId,
  userId,
  redirectTo,
  triggerLabel = 'Start Session',
  triggerIcon,
  triggerClassName,
  trigger,
  disabled = false,
  isLoading = false,
  isOpen: customIsOpen,
  onOpenChange: customOnOpenChange,
}: StartSessionDialogProps) {
  const { state, Form } = useFetcher();
  const [internalOpen, setInternalOpen] = useState(false);
  const [trackComp, setTrackComp] = useState(false);

  const isControlled = customIsOpen !== undefined;
  const open = isControlled ? customIsOpen : internalOpen;

  const isSubmitting = state === 'submitting' || isLoading;
  const isTriggerDisabled = disabled || !characterId || !userId || isSubmitting;

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting && !nextOpen) return;
    if (!nextOpen) {
      setTrackComp(false);
    }
    if (customOnOpenChange) {
      customOnOpenChange(nextOpen);
    }
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <LoadingButton
            type="button"
            variant="default"
            disabled={isTriggerDisabled}
            isLoading={isSubmitting}
            className={cn('w-full justify-center gap-2 sm:w-auto', triggerClassName)}
          >
            {triggerIcon ?? <PlusIcon className="h-4 w-4" />}
            <span>{triggerLabel}</span>
          </LoadingButton>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Session</DialogTitle>
          <DialogDescription>
            Configure tracking options before queueing into the Crucible.
          </DialogDescription>
        </DialogHeader>
        <Form
          method="post"
          action="/action/start-session"
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="characterId" value={characterId ?? ''} />
          <input type="hidden" name="userId" value={userId ?? ''} />
          {redirectTo !== undefined && (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          )}

          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors',
              trackComp
                ? 'border-primary bg-primary/5'
                : 'border-border/70 bg-muted/20 hover:border-border',
              isSubmitting && 'cursor-not-allowed opacity-60',
            )}
          >
            <input
              type="checkbox"
              name="trackComp"
              value="true"
              checked={trackComp}
              disabled={isSubmitting}
              onChange={(e) => setTrackComp(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary disabled:opacity-50"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <SwordsIcon className="h-4 w-4 shrink-0 text-primary" />
                <span>Track Competitive Score</span>
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                1 Trick will snapshot your current Competitive Division rank and
                points now and calculate your gain or loss when the session
                ends.
              </span>
            </div>
          </label>

          <DialogFooter className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <LoadingButton
              type="submit"
              variant="default"
              disabled={isTriggerDisabled}
              isLoading={isSubmitting}
              className="gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Start Session</span>
            </LoadingButton>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
