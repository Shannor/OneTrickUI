import { useEffect, useState } from 'react';

let isHydratedGlobal = false;

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState<boolean>(isHydratedGlobal);

  useEffect(() => {
    isHydratedGlobal = true;
    setHydrated(true);
  }, []);

  return hydrated;
}
