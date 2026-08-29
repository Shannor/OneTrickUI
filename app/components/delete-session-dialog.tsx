import type React from 'react';
import { DeleteConfirmationDialog } from '~/components/delete-confirmation-dialog';

interface DeleteSessionDialogProps {
  sessionId: string;
  sessionName?: string;
  characterId?: string;
  userId?: string;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteSessionDialog({
  sessionId,
  sessionName,
  characterId,
  userId,
  trigger,
  isOpen,
  onOpenChange,
}: DeleteSessionDialogProps) {
  return (
    <DeleteConfirmationDialog
      title={`Delete ${sessionName ? `"${sessionName}"` : 'Session'}`}
      description="Are you sure you want to delete this session? This action cannot be undone and will permanently remove all associated activity records."
      action="/action/delete-session"
      hiddenFields={{ sessionId, characterId, userId }}
      confirmText="Delete Session"
      triggerText="Delete Session"
      trigger={trigger}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    />
  );
}
