'use client';

import { usePageReady } from './PageReadyProvider';
import clsx from 'clsx';

export default function GateShell({ children }: { children: React.ReactNode }) {
  const { ready } = usePageReady();
  return (
    <div className={clsx('min-h-screen flex flex-col', !ready && 'opacity-0 pointer-events-none select-none')}>
      {children}
    </div>
  );
}
