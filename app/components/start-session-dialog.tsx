import { AlertCircleIcon, PlusIcon, SwordsIcon } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { toast } from '~/components/ui/sonner';
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

function getStartSessionErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  if (error && typeof error === 'object') {
    if (
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.trim().length > 0
    ) {
      return error.message;
    }
    if (
      'error' in error &&
      typeof error.error === 'string' &&
      error.error.trim().length > 0
    ) {
      return error.error;
    }
  }
  return 'Failed to start session. Please try again.';
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
  const { state, data, Form } = useFetcher<{ error?: unknown }>();
  const [internalOpen, setInternalOpen] = useState(false);
  const [trackComp, setTrackComp] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const previousState = useRef(state);

  const isControlled = customIsOpen !== undefined;
  const open = isControlled ? customIsOpen : internalOpen;

  const isSubmitting = state !== 'idle' || isLoading;
  const isTriggerDisabled = disabled || !characterId || !userId || isSubmitting;

  const closeDialog = useCallback(() => {
    setTrackComp(false);
    setHasSubmitted(false);
    if (customOnOpenChange) {
      customOnOpenChange(false);
    }
    if (!isControlled) {
      setInternalOpen(false);
    }
  }, [customOnOpenChange, isControlled]);

  useEffect(() => {
    if (previousState.current !== 'idle' && state === 'idle' && hasSubmitted) {
      if (data?.error) {
        toast.error(getStartSessionErrorMessage(data.error));
      } else {
        closeDialog();
      }
    }
    previousState.current = state;
  }, [state, data, hasSubmitted, closeDialog]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting && !nextOpen) return;
    if (!nextOpen) {
      setTrackComp(false);
      setHasSubmitted(false);
    }
    if (customOnOpenChange) {
      customOnOpenChange(nextOpen);
    }
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
  };

  const errorMessage =
    hasSubmitted && state === 'idle' && data?.error
      ? getStartSessionErrorMessage(data.error)
      : undefined;

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
            className={cn(
              'w-full justify-center gap-2 sm:w-auto',
              triggerClassName,
            )}
          >
            {triggerIcon ?? <PlusIcon className="h-4 w-4" />}
            <span>{triggerLabel}</span>
          </LoadingButton>
        </DialogTrigger>
      )}
      <DialogContent
        onEscapeKeyDown={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Start Session</DialogTitle>
          <DialogDescription>
            Configure tracking options before queueing into the Crucible.
          </DialogDescription>
        </DialogHeader>
        <Form
          method="post"
          action="/action/start-session"
          onSubmit={() => setHasSubmitted(true)}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="characterId" value={characterId ?? ''} />
          <input type="hidden" name="userId" value={userId ?? ''} />
          {redirectTo !== undefined && (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          )}

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
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
