import { Loader2 } from 'lucide-react';
import React, { type ReactNode } from 'react';
import { useIsNavigating } from '~/hooks/use-route-loaders';

interface LoadingState {
  isNavigating: boolean;
}
interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'full';
  children: ReactNode | ((state: LoadingState) => ReactNode);
}
export function NavLoading({ children }: Props) {
  const [isNavigating] = useIsNavigating();

  if (typeof children === 'function') {
    return children({ isNavigating });
  }

  if (!isNavigating) {
    return children;
  }
  return (
    <div className="h-full w-full text-center">
      <Loader2 className="mr-2 h-8 w-8 animate-spin" />
    </div>
  );
}
