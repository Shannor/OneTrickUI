import type React from 'react';
import { DeleteConfirmationDialog } from '~/components/delete-confirmation-dialog';

interface DeleteSnapshotDialogProps {
  snapshotId: string;
  snapshotName?: string;
  characterId?: string;
  userId?: string;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteSnapshotDialog({
  snapshotId,
  snapshotName,
  characterId,
  userId,
  trigger,
  isOpen,
  onOpenChange,
}: DeleteSnapshotDialogProps) {
  return (
    <DeleteConfirmationDialog
      title={`Delete ${snapshotName ? `"${snapshotName}"` : 'Loadout'}`}
      description="Are you sure you want to delete this loadout? This action cannot be undone and will permanently remove this loadout snapshot."
      action="/action/delete-snapshot"
      hiddenFields={{ snapshotId, characterId, userId }}
      confirmText="Delete Loadout"
      triggerText="Delete Loadout"
      trigger={trigger}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    />
  );
}
