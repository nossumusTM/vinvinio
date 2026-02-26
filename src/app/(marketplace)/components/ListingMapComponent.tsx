'use client';

import ListingsMapOverlay from '@/app/(marketplace)/components/ListingsMapOverlay';
import type { SafeListing } from '@/app/(marketplace)/types';
import L from 'leaflet';

interface ListingMapComponentProps {
  isOpen: boolean;
  onClose: () => void;
  listing?: SafeListing | null;
  highlightedCoords?: L.LatLngTuple | null;
  highlightedLabel?: string | null;
  highlightedIcon?: L.Icon | L.DivIcon;
}

const ListingMapComponent: React.FC<ListingMapComponentProps> = ({
  isOpen,
  onClose,
  listing,
  highlightedCoords,
  highlightedLabel,
  highlightedIcon,
}) => {
  return (
    <ListingsMapOverlay
      isOpen={isOpen}
      onClose={onClose}
      initialListings={listing ? [listing] : []}
      highlightedListingId={listing?.id ?? null}
      highlightedCoords={highlightedCoords ?? null}
      highlightedLabel={highlightedLabel ?? null}
      highlightedIcon={highlightedIcon}
      minimalUI
    />
  );
};

export default ListingMapComponent;
