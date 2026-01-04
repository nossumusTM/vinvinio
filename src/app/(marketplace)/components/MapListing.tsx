'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { useMap } from 'react-leaflet';

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
  center?: number[];           // Optional manual coordinates
  searchQuery?: string;        // Name like "Colosseo"
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

const MapListing: React.FC<MapProps> = ({ center, searchQuery }) => {
  const [coordinates, setCoordinates] = useState<number[] | null>(null);
  const [isClient, setIsClient] = useState(false);
  const mapIdRef = useRef(`map-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const fetchCoordinates = async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
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
  }, [searchQuery]);

  if (!isClient) return null;

  const position = coordinates || center || [41.8719, 12.5674]; // Default to Italy

  return (
    <div id={mapIdRef.current} className="h-[35vh] rounded-lg overflow-hidden">
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
        <Marker position={position as L.LatLngExpression} />
      </MapContainer>
    </div>
  );
};

export default MapListing;
