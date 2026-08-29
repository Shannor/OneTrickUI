import { useEffect, useRef } from 'react';
import { useFetcher } from 'react-router';
import { LoadingButton } from '~/components/loading-button';
import { Input } from '~/components/ui/input';
import { toast } from '~/components/ui/sonner';
import { Textarea } from '~/components/ui/textarea';

export interface SessionUpdateFormProps {
  sessionId: string;
  defaultName?: string;
  defaultDescription?: string;
}

export function SessionUpdateForm({
  sessionId,
  defaultName,
  defaultDescription,
}: SessionUpdateFormProps) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';
  const previousState = useRef(fetcher.state);

  useEffect(() => {
    if (previousState.current !== 'idle' && fetcher.state === 'idle') {
      if (fetcher.data?.error) {
        toast.error('Failed to update session');
      } else {
        toast.success('Session updated successfully');
      }
    }
    previousState.current = fetcher.state;
  }, [fetcher.state, fetcher.data]);

  return (
    <fetcher.Form
      method="post"
      action="/action/update-session"
      className="flex w-full flex-col gap-3 md:max-w-md"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <Input
        name="name"
        defaultValue={defaultName ?? ''}
        placeholder="Session Name"
        className="h-auto border-none bg-transparent px-1 py-1 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-1 focus-visible:ring-ring md:text-3xl"
      />
      <Textarea
        name="description"
        placeholder="Add a description..."
        className="min-h-[80px] w-full resize-y text-sm"
        defaultValue={defaultDescription ?? ''}
      />
      <div className="flex justify-start">
        <LoadingButton
          type="submit"
          size="sm"
          className="w-full sm:w-auto"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          Save
        </LoadingButton>
      </div>
    </fetcher.Form>
  );
}
