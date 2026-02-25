'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

import type { SafeListing } from '@/app/(marketplace)/types';

interface MapComponentProps {
  initialListings: SafeListing[];
}

const MapComponent: React.FC<MapComponentProps> = ({ initialListings }) => {
  const ListingsMapOverlay = useMemo(
    () => dynamic(() => import('@/app/(marketplace)/components/ListingsMapOverlay'), { ssr: false }),
    [],
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <ListingsMapOverlay
        isOpen
        embedded
        onClose={() => {}}
        initialListings={initialListings}
      />
    </div>
  );
};

export default MapComponent;
