'use client';

import { usePageReady } from './PageReadyProvider';
import Loader from './Loader';

export default function FullScreenLoader() {
  const { ready } = usePageReady();
  if (ready) return null;
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-white backdrop-blur-sm">
      <Loader />
    </div>
  );
}
