import { Loader2 } from 'lucide-react';
import type React from 'react';
import { Button, type ButtonProps } from '~/components/ui/button';
import { cn } from '~/lib/utils';

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
  const { className, ...rest } = props;
  return (
    <Button
      disabled={isLoading}
      className={cn({ 'pointer-events-none opacity-50': isLoading }, className)}
      {...rest}
    >
      {isLoading ? (
        <span className="flex flex-row items-center gap-2">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
