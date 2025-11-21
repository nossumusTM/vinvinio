'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet icon paths
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
});

interface MapProps {
  center?: [number, number];
  city?: string;
  country?: string;
}

const DEFAULT_CENTER: L.LatLngTuple = [41.8719, 12.5674];

const RecenterMap = ({ coords }: { coords: L.LatLngTuple }) => {
  const map = useMap();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      map.invalidateSize();
      map.setView(coords, map.getZoom() || 10, { animate: false });
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [coords, map]);

  return null;
};

const CaptureMapRef = ({ onReady }: { onReady: (map: L.Map) => void }) => {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
};

const Map: React.FC<MapProps> = ({ center, city, country }) => {
  const [coordinates, setCoordinates] = useState<L.LatLngTuple>(
    center ?? DEFAULT_CENTER,
  );
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapIdRef = useRef(`map-${Math.random().toString(36).slice(2, 9)}`);

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
          className="h-full w-full"
          attributionControl={false}
          whenReady={() => setIsMapReady(true)}
        >
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
          <Marker position={effectiveCenter as L.LatLngExpression} />
        </MapContainer>
      )}

      {isClient && inView && coordsReady && !isMapReady && (
        <div className="absolute inset-0 pointer-events-none bg-white/70">
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-600">
            Loading map…
          </div>
        </div>
      )}
    </div>
  );


};

export default Map;

