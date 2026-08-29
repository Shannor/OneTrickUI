import { Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Form } from 'react-router';
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

export interface DeleteConfirmationDialogProps {
  title: string;
  description: string;
  action: string;
  hiddenFields?: Record<string, string | undefined>;
  confirmText?: string;
  triggerText?: string;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteConfirmationDialog({
  title,
  description,
  action,
  hiddenFields = {},
  confirmText = 'Delete',
  triggerText = 'Delete',
  trigger,
  isOpen: customIsOpen,
  onOpenChange: customOnOpenChange,
}: DeleteConfirmationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = customIsOpen !== undefined;
  const open = isControlled ? customIsOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (customOnOpenChange) {
      customOnOpenChange(value);
    }
    if (!isControlled) {
      setInternalOpen(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="destructive" className="w-full lg:w-auto">
            <Trash2 className="h-4 w-4" />
            {triggerText}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form method="post" action={action}>
          {Object.entries(hiddenFields).map(
            ([name, value]) =>
              value !== undefined && (
                <input key={name} type="hidden" name={name} value={value} />
              ),
          )}
          <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive">
              {confirmText}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
