'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { GiPositionMarker } from "react-icons/gi";
import { GrFormLocation } from "react-icons/gr";
import { FiMaximize2, FiMinus, FiPlus } from 'react-icons/fi';
import { MdFullscreen } from "react-icons/md";
import L from 'leaflet';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

import type { SafeListing } from '@/app/(marketplace)/types';

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

const CaptureMapRef = ({ onReady }: { onReady: (map: L.Map) => void }) => {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
};

const MapZoomControls = ({
  onZoomIn,
  onZoomOut,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
}) => (
  <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
    <button
      type="button"
      onClick={onZoomIn}
      aria-label="Zoom in"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/30 text-neutral-800 shadow-lg backdrop-blur transition hover:bg-white/50"
    >
      <FiPlus />
    </button>
    <button
      type="button"
      onClick={onZoomOut}
      aria-label="Zoom out"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/30 text-neutral-800 shadow-lg backdrop-blur transition hover:bg-white/50"
    >
      <FiMinus />
    </button>
  </div>
);

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

  const mapRef = useRef<L.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const pinIcon = useMemo(
    () =>
      L.divIcon({
        html: renderToStaticMarkup(
          <div className="flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent shadow-lg ring-1 ring-white/60 backdrop-blur-sm">
              <GrFormLocation className="h-9 w-9 drop-shadow-sm" color="#2200ffff" />
            </div>
          </div>,
        ),
        className: 'map-pin-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      }),
    [],
  );

  const getActiveMap = useCallback(() => {
    const map = mapRef.current;
    if (!map) return null;
    const container = map.getContainer?.();
    if (!container || !container.isConnected) return null;
    const { _loaded, _mapPane } = map as L.Map & { _loaded?: boolean; _mapPane?: HTMLElement };
    if (!_mapPane || _loaded === false) return null;
    return map;
  }, []);

  const handleZoomIn = () => {
    const map = getActiveMap();
    if (map) map.zoomIn();
  };

  const handleZoomOut = () => {
    const map = getActiveMap();
    if (map) map.zoomOut();
  };

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
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white/10 text-neutral-700 shadow-md backdrop-blur transition hover:bg-white/50"
      >
        <MdFullscreen size={16} />
      </button>
      <MapContainer
        center={position as L.LatLngExpression}
        zoom={24}
        scrollWheelZoom={false}
        zoomControl={false}
        className="h-full w-full"
        attributionControl={false}
        key={mapIdRef.current}
        whenReady={() => setIsMapReady(true)}
      >
        <CaptureMapRef
          onReady={(mapInstance) => {
            mapRef.current = mapInstance;

            window.setTimeout(() => {
              const map = getActiveMap();
              if (!map) return;
              try {
                map.invalidateSize();
              } catch (err) {
                console.warn('Leaflet invalidateSize skipped:', err);
              }
            }, 120);
          }}
        />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <RecenterMap position={position as L.LatLngExpression} />
        <MapClickHandler onClick={() => setIsOverlayOpen(true)} />
        <Marker position={position as L.LatLngExpression} icon={pinIcon} />
      </MapContainer>
      {isClient && isMapReady && (
        <MapZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      )}
      <ListingsMapOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        initialListings={listing ? [listing] : []}
        highlightedListingId={listing?.id ?? null}
        highlightedCoords={position as L.LatLngTuple}
        highlightedLabel={highlightLabel}
        highlightedIcon={pinIcon}
      />
    </div>
  );
};

export default MapListing;
