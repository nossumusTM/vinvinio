'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Ctx = { ready: boolean; setReady: (v: boolean) => void };
const CtxObj = createContext<Ctx | null>(null);

export const usePageReady = () => {
  const ctx = useContext(CtxObj);
  if (!ctx) throw new Error('usePageReady must be used within PageReadyProvider');
  return ctx;
};

export default function PageReadyProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  // SAFETY: auto-unlock after 8s so you never get stuck behind the loader
  useEffect(() => {
    if (ready) return;
    const id = setTimeout(() => setReady(true), 8000);
    return () => clearTimeout(id);
  }, [ready]);

  const value = useMemo(() => ({ ready, setReady }), [ready]);
  return <CtxObj.Provider value={value}>{children}</CtxObj.Provider>;
}
