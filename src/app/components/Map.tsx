// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import L from 'leaflet';
// import { MapContainer, Marker, TileLayer } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';

// import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// import markerIcon from 'leaflet/dist/images/marker-icon.png';
// import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// // Fix Leaflet icon paths
// // @ts-ignore
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconUrl: markerIcon.src,
//   iconRetinaUrl: markerIcon2x.src,
//   shadowUrl: markerShadow.src,
// });

// interface MapProps {
//   center?: number[];
//   searchQuery?: string; // NEW
// }

// const Map: React.FC<MapProps> = ({ center, searchQuery }) => {
//   const [isClient, setIsClient] = useState(false);
//   const mapIdRef = useRef(`map-${Math.random().toString(36).substring(2, 9)}`);
//   const [dynamicCenter, setDynamicCenter] = useState<number[] | null>(null);

//   useEffect(() => {
//     setIsClient(true);
  
//     if (!center && searchQuery) {
//       fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
//         .then((res) => res.json())
//         .then((data) => {
//           if (data && data.length > 0) {
//             const { lat, lon } = data[0];
//             setDynamicCenter([parseFloat(lat), parseFloat(lon)]);
//           }
//         })
//         .catch((err) => console.error("Geocoding failed:", err));
//     }
//   }, [searchQuery, center]);

//   if (!isClient) return null;

//   // const position = center || [51, -0.09];
//   const position = center || dynamicCenter || [51, -0.09];

//   return (
//     <div id={mapIdRef.current} className="h-[35vh] rounded-lg overflow-hidden">
//       <MapContainer
//         center={position as L.LatLngExpression}
//         zoom={center ? 30 : 15}
//         scrollWheelZoom={false}
//         style={{ height: '100%', width: '100%' }}
//         attributionControl={false}
//         key={mapIdRef.current} // Unique key per mount
//       >
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         />
//         <Marker position={position as L.LatLngExpression} />
//       </MapContainer>
//     </div>
//   );
// };

// export default Map;

'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
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
  center?: number[];           // Optional manual coordinates
  searchQuery?: string;        // Name like "Colosseo"
}

const Map: React.FC<MapProps> = ({ center, searchQuery }) => {
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
        zoom={center ? 30 : 10}
        scrollWheelZoom={false}
        style={{ height: '88%', width: '100%', borderRadius: '20px' }}
        attributionControl={false}
        key={mapIdRef.current}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position as L.LatLngExpression} />
      </MapContainer>
    </div>
  );
};

export default Map;
