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
    const onResize = () => mapRef.current?.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!isClient) return null;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        key={mapIdRef.current}
        center={effectiveCenter as L.LatLngExpression}
        zoom={10}
        scrollWheelZoom={false}
        className="h-full w-full"
        attributionControl={false}
      >
        <CaptureMapRef
          onReady={(mapInstance) => {
            mapRef.current = mapInstance;
            window.setTimeout(() => {
              mapInstance.invalidateSize();
              mapInstance.setView(effectiveCenter, 10, { animate: false });
            }, 80);
          }}
        />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <RecenterMap coords={effectiveCenter} />
        <Marker position={effectiveCenter as L.LatLngExpression} />
      </MapContainer>
    </div>
  );
};

export default Map;

