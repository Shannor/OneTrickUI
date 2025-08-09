'use client';

import { Suspense, type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface ClientFallbackProps {
  children: ReactNode;
  errorFallback?: ReactNode;
  suspenseFallback?: ReactNode;
}

export function ClientFallback({
  children,
  errorFallback = <div>Something went wrong</div>,
  suspenseFallback = <div>Loading...</div>,
}: ClientFallbackProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={suspenseFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
