'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { createPortal } from 'react-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { FiMaximize2, FiMinus, FiPlus } from 'react-icons/fi';

import { useMapEvent } from 'react-leaflet';

import type { SafeListing } from '@/app/(marketplace)/types';

interface MapProps {
  center?: [number, number];
  city?: string;
  country?: string;
  allowFullscreen?: boolean;
}

const DEFAULT_CENTER: L.LatLngTuple = [41.8719, 12.5674];

const CaptureMapRef = ({ onReady }: { onReady: (map: L.Map) => void }) => {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
};

const Map: React.FC<MapProps> = ({ center, city, country, allowFullscreen = false }) => {
  const [coordinates, setCoordinates] = useState<L.LatLngTuple>(
    center ?? DEFAULT_CENTER,
  );
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapIdRef = useRef(`map-${Math.random().toString(36).slice(2, 9)}`);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<L.LatLngTuple | null>(null);

  const [inView, setInView] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [coordsReady, setCoordsReady] = useState<boolean>(!!center);

  const effectiveCenter = useMemo<L.LatLngTuple>(() => {
    if (coordinates && coordinates.length === 2) {
      return [coordinates[0], coordinates[1]];
    }
    return DEFAULT_CENTER;
  }, [coordinates]);

  const pinIcon = useMemo(
    () =>
      L.divIcon({
        html: renderToStaticMarkup(
          <div className="flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 shadow-lg ring-1 ring-white/60 backdrop-blur">
              <FaMapMarkerAlt className="h-6 w-6 drop-shadow-sm" color="#2200ffff" />
            </div>
          </div>
        ),
        className: 'map-pin-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      }),
    [],
  );

  const openOverlay = useCallback(() => {
    if (!allowFullscreen) return;
    setIsOverlayOpen(true);
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoords: L.LatLngTuple = [position.coords.latitude, position.coords.longitude];
        setUserCoords(nextCoords);
      },
      () => {
        setUserCoords(null);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [allowFullscreen]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      setCoordinates(center);
      setCoordsReady(true);
    }
  }, [center?.[0], center?.[1]]);

  useEffect(() => {
    if (city && country) {
      const controller = new AbortController();
      const fetchCoordinates = async () => {
        try {
          const fullQuery = `${city}, ${country}`;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&accept-language=en&q=${encodeURIComponent(fullQuery)}`,
            { signal: controller.signal }
          );
          const data = await res.json();
          if (data?.length > 0) {
            const { lat, lon } = data[0];
            setCoordinates([parseFloat(lat), parseFloat(lon)]);
            setCoordsReady(true);
          }
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.error('Failed to fetch coordinates:', err);
          }
        }
      };
      setCoordinates((prev) => {
        if (center && Array.isArray(center) && center.length === 2) {
          return center;
        }
        return prev;
      });
      fetchCoordinates();
      return () => controller.abort();
    }
  }, [city, country, center]);

  useEffect(() => {
    const onResize = () => {
      const map = mapRef.current as L.Map | null;
      const container = (map as any)?._container;
      if (!map || !container) return;
      map.invalidateSize();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // if (!isClient) return null;

  useEffect(() => {
    if (!rootRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (center || city || country) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (!cancelled && data?.latitude && data?.longitude) {
          setCoordinates([Number(data.latitude), Number(data.longitude)]);
          setCoordsReady(true);
        }
      } catch {
        // silently ignore, fallback stays in place
      }
    })();
    return () => { cancelled = true; };
  }, [center, city, country]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    mapRef.current.setView(effectiveCenter, 10, { animate: false });
  }, [effectiveCenter, isMapReady]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const ListingsMapOverlay = useMemo(
    () => dynamic(() => import('./ListingsMapOverlay'), { ssr: false }),
    [],
  );

  const overlayCenter = userCoords ?? effectiveCenter;

  const MapClickHandler = ({ onClick, enabled }: { onClick: () => void; enabled: boolean }) => {
    useMapEvent('click', () => {
      if (!enabled) return;
      onClick();
    });
    return null;
  };

  return (
    <div ref={rootRef} className="relative h-full w-full">
      {(!isClient || !inView || !coordsReady) && (
        <div className="absolute inset-0 animate-pulse bg-neutral-100 rounded-lg" />
      )}

      {isClient && inView && coordsReady && (
        <MapContainer
          key={mapIdRef.current}
          center={effectiveCenter as L.LatLngExpression}
          zoom={10}
          scrollWheelZoom={false}
          zoomControl={false}
          className="h-full w-full"
          attributionControl={false}
          whenReady={() => setIsMapReady(true)}
        >
        <MapClickHandler onClick={openOverlay} enabled={allowFullscreen} />
          <CaptureMapRef
            onReady={(mapInstance) => {
              mapRef.current = mapInstance;

              window.setTimeout(() => {
                const map = mapRef.current as L.Map | null;
                // Guard: map might be gone or not fully initialized yet
                const container = (map as any)?._container;
                if (!map || !container) return;

                try {
                  map.invalidateSize();
                } catch (err) {
                  console.warn('Leaflet invalidateSize skipped:', err);
                }
              }, 120); // slightly longer delay is fine
            }}
          />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{ load: () => setIsMapReady(true) }}
          />
          <Marker position={effectiveCenter as L.LatLngExpression} icon={pinIcon} />
        </MapContainer>
      )}

      {isClient && inView && coordsReady && !isMapReady && (
        <div className="absolute inset-0 pointer-events-none bg-white/70">
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-600">
            Loading map…
          </div>
        </div>
      )}
      
      {allowFullscreen && (
        <button
          type="button"
          onClick={openOverlay}
          className="absolute right-3 top-3 z-20 inline-flex items-center justify-center rounded-full bg-white/30 backdrop-blur p-2 text-neutral-700 shadow-md transition hover:bg-white/50"
          aria-label="Open fullscreen map"
        >
          <FiMaximize2 className="h-4 w-4" />
        </button>
      )}

      {isClient && isMapReady && (
        <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="flex h-8 w-8 items-center justify-center rounded-full  bg-white/30 text-neutral-800 shadow-lg backdrop-blur transition hover:bg-white/50"
          >
            <FiPlus />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="flex h-8 w-8 items-center justify-center rounded-full  bg-white/30 text-neutral-800 shadow-lg backdrop-blur transition hover:bg-white/50"
          >
            <FiMinus />
          </button>
        </div>
      )}

      {isClient && allowFullscreen && isOverlayOpen
        ? createPortal(
            <ListingsMapOverlay
              isOpen
              onClose={() => setIsOverlayOpen(false)}
              initialListings={[] as SafeListing[]}
              highlightedCoords={overlayCenter}
              highlightedLabel="Your location"
              highlightedIcon={pinIcon}
              initialUserLocation={userCoords}
              startNearbyOnly
            />,
            document.body,
          )
        : null}
    </div>
  );


};

export default Map;

