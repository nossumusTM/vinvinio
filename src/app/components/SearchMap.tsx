'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap
} from 'react-leaflet';
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
  center?: number[];
  searchQuery?: string;
  city?: string;
  country?: string;
}

// 🔄 Helper to recenter map after coordinates change
// const RecenterMap = ({ coords }: { coords: number[] }) => {
//   const map = useMap();

//   useEffect(() => {
//     if (coords) {
//       map.setView(coords as [number, number], 10);
//     }
//   }, [coords, map]);

//   return null;
// };

// 1) UPDATE RecenterMap to also invalidate size before recentering
const RecenterMap = ({ coords }: { coords: number[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!coords) return;
    // allow modal/layout to settle on mobile, then fix size + center
    const t = setTimeout(() => {
      map.invalidateSize();
      map.setView(coords as [number, number], map.getZoom() || 10, { animate: false });
    }, 80);
    return () => clearTimeout(t);
  }, [coords, map]);

  return null;
};

// 1) ADD this tiny helper inside SearchMap.tsx (near RecenterMap)
const CaptureMapRef = ({ onReady }: { onReady: (m: L.Map) => void }) => {
  const map = useMap();
  useEffect(() => { onReady(map); }, [map, onReady]);
  return null;
};

const Map: React.FC<MapProps> = ({ center, city, country }) => {
  const [coordinates, setCoordinates] = useState<number[] | null>(null);
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapIdRef = useRef(`map-${Math.random().toString(36).substring(2, 9)}`);

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

  const position = coordinates || center || [41.8719, 12.5674]; // Default to Italy

  return (
    <div className="w-full rounded-lg overflow-hidden relative">
    <div className="w-full h-[140px] sm:h-[260px] md:h-[360px] flex items-center justify-center">
    <MapContainer
      center={position as L.LatLngExpression}
      zoom={10}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
      attributionControl={false}
      key={mapIdRef.current}
    >
      <CaptureMapRef
        onReady={(m) => {
          mapRef.current = m;
          setTimeout(() => {
            m.invalidateSize();
            m.setView(position as L.LatLngExpression, 10, { animate: false });
          }, 80);
        }}
      />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {coordinates && <RecenterMap coords={coordinates} />}
      <Marker position={(coordinates || position) as L.LatLngExpression} />
    </MapContainer>
  </div>
</div>
  );
};

export default Map;
