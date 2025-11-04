'use client';

import { useState, useEffect } from 'react';
import Loader from './Loader';

export default function FullPageLoaderBelowNav({
  ready,
}: {
  ready: boolean;
}) {
  if (ready) return null;

  return (
    <div className="fixed top-[72px] left-0 right-0 bottom-0 z-[9999] bg-white/90 backdrop-blur-sm flex items-center justify-center">
      <Loader />
    </div>
  );
}