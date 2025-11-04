// app/components/LoadingGate.tsx
'use client';
import { createContext, useContext, useState } from 'react';

const GateCtx = createContext<{ready: boolean; setReady: (v:boolean)=>void} | null>(null);
export const useLoadingGate = () => useContext(GateCtx)!;

export default function LoadingGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  return <GateCtx.Provider value={{ ready, setReady }}>{children}</GateCtx.Provider>;
}