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

interface StartSessionDialogFormProps {
  characterId?: string;
  userId?: string;
  redirectTo?: string;
  disabled: boolean;
  isLoading: boolean;
  onSubmittingChange: (submitting: boolean) => void;
  onSuccess: () => void;
}

function StartSessionDialogForm({
  characterId,
  userId,
  redirectTo,
  disabled,
  isLoading,
  onSubmittingChange,
  onSuccess,
}: StartSessionDialogFormProps) {
  const { state, data, Form } = useFetcher<{ error?: unknown }>();
  const [trackComp, setTrackComp] = useState(false);
  const previousState = useRef(state);

  const isSubmitting = state !== 'idle' || isLoading;
  const isSubmitDisabled = disabled || !characterId || !userId || isSubmitting;

  useEffect(() => {
    return () => {
      onSubmittingChange(false);
    };
  }, [onSubmittingChange]);

  useEffect(() => {
    if (previousState.current !== 'idle' && state === 'idle') {
      onSubmittingChange(false);
      if (data?.error) {
        toast.error(getStartSessionErrorMessage(data.error));
      } else {
        onSuccess();
      }
    }
    previousState.current = state;
  }, [state, data, onSubmittingChange, onSuccess]);

  const errorMessage =
    state === 'idle' && data?.error
      ? getStartSessionErrorMessage(data.error)
      : undefined;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Start Session</DialogTitle>
        <DialogDescription>
          Configure tracking options before queueing into the Crucible.
        </DialogDescription>
      </DialogHeader>
      <Form
        method="post"
        action="/action/start-session"
        onSubmit={() => onSubmittingChange(true)}
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
              points now and calculate your gain or loss when the session ends.
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
            disabled={isSubmitDisabled}
            isLoading={isSubmitting}
            className="gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Start Session</span>
          </LoadingButton>
        </DialogFooter>
      </Form>
    </>
  );
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
  const [internalOpen, setInternalOpen] = useState(false);
  const isSubmittingRef = useRef(false);

  const isControlled = customIsOpen !== undefined;
  const open = isControlled ? customIsOpen : internalOpen;

  const isTriggerDisabled = disabled || !characterId || !userId || isLoading;

  const handleSubmittingChange = useCallback((submitting: boolean) => {
    isSubmittingRef.current = submitting;
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if ((isSubmittingRef.current || isLoading) && !nextOpen) return;
      if (customOnOpenChange) {
        customOnOpenChange(nextOpen);
      }
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
    },
    [customOnOpenChange, isControlled, isLoading],
  );

  const handleSuccess = useCallback(() => {
    isSubmittingRef.current = false;
    handleOpenChange(false);
  }, [handleOpenChange]);

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
            isLoading={isLoading}
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
          if (isSubmittingRef.current || isLoading) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isSubmittingRef.current || isLoading) e.preventDefault();
        }}
      >
        <StartSessionDialogForm
          characterId={characterId}
          userId={userId}
          redirectTo={redirectTo}
          disabled={disabled}
          isLoading={isLoading}
          onSubmittingChange={handleSubmittingChange}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
