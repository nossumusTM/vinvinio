'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import dynamic from 'next/dynamic';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { useMap, useMapEvents } from 'react-leaflet';
import { FiMaximize2 } from 'react-icons/fi';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import type { SafeListing } from '@/app/(marketplace)/types';

// Fix Leaflet icon paths
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
});

interface MapProps {
  center?: number[];           // Optional manual coordinates
  searchQuery?: string;        // Name like "Colosseo"
  listing?: SafeListing | null;
}

interface RecenterProps {
  position: L.LatLngExpression;
}

const RecenterMap: React.FC<RecenterProps> = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom(), {
      animate: true,
    });
  }, [position, map]);

  return null;
};

const MapClickHandler = ({ onClick }: { onClick: () => void }) => {
  useMapEvents({
    click: () => onClick(),
  });

  return null;
};

const MapListing: React.FC<MapProps> = ({ center, searchQuery, listing }) => {
  const [coordinates, setCoordinates] = useState<number[] | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const mapIdRef = useRef(`map-${Math.random().toString(36).substring(2, 9)}`);

  const ListingsMapOverlay = useMemo(
    () => dynamic(() => import('./ListingsMapOverlay'), { ssr: false }),
    [],
  );

  const resolvedQuery =
    searchQuery ||
    listing?.meetingPoint ||
    listing?.locationDescription ||
    listing?.locationValue ||
    '';

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (resolvedQuery) {
      const fetchCoordinates = async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(resolvedQuery)}`
          );
          const data = await res.json();
          if (data?.length > 0) {
            const { lat, lon } = data[0];
            setCoordinates([parseFloat(lat), parseFloat(lon)]);
          }
        } catch (err) {
          console.error('Failed to fetch coordinates:', err);
        }
      };
      fetchCoordinates();
    }
  }, [resolvedQuery]);

  if (!isClient) return null;

  const position = coordinates || center || [41.8719, 12.5674]; // Default to Italy

  const highlightLabel =
    listing?.meetingPoint || listing?.locationDescription || listing?.locationValue || resolvedQuery;

  return (
    <div id={mapIdRef.current} className="relative h-[35vh] rounded-lg overflow-hidden">
      <button
        type="button"
        aria-label="Open full map"
        onClick={() => setIsOverlayOpen(true)}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-700 shadow-md backdrop-blur transition hover:border-neutral-300"
      >
        <FiMaximize2 size={16} />
      </button>
      <MapContainer
        center={position as L.LatLngExpression}
        zoom={24}
        scrollWheelZoom={false}
        style={{ height: '88%', width: '100%', borderRadius: '20px' }}
        attributionControl={false}
        key={mapIdRef.current}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap position={position as L.LatLngExpression} />
        <MapClickHandler onClick={() => setIsOverlayOpen(true)} />
        <Marker position={position as L.LatLngExpression} />
      </MapContainer>
      <ListingsMapOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        initialListings={listing ? [listing] : []}
        highlightedListingId={listing?.id ?? null}
        highlightedCoords={position as L.LatLngTuple}
        highlightedLabel={highlightLabel}
      />
    </div>
  );
};

export default MapListing;
