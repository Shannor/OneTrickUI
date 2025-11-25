import { Loader2 } from 'lucide-react';
import React from 'react';
import { Button, type ButtonProps } from '~/components/ui/button';

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({
  isLoading = false,
  loadingText = 'Loading...',
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={isLoading} {...props}>
      {isLoading ? (
        <div className="flex flex-row gap-2">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </div>
      ) : (
        children
      )}
    </Button>
  );
}
