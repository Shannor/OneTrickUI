import { useLocation } from 'react-router';
import { useEffect } from 'react';

import type { IStaticMethods } from 'preline/preline';
declare global {
  interface Window {
    HSStaticMethods: IStaticMethods;
  }
}

export default function PrelineInit() {
  const location = useLocation();

  useEffect(() => {
    import('preline/preline').then(() => {
      window.HSStaticMethods?.autoInit();
    });
  }, [location.pathname]);

  return null;
}
