'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import L from 'leaflet';
import Image from 'next/image';
import Link from 'next/link';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { IoClose } from 'react-icons/io5';
import { LuLocateFixed } from 'react-icons/lu';
import { FiMinus, FiPlus } from 'react-icons/fi';
import clsx from 'clsx';
import Slider from 'react-slick';
import { AnimatePresence, motion } from 'framer-motion';

import type { SafeListing } from '@/app/(marketplace)/types';
import useCountries from '@/app/(marketplace)/hooks/useCountries';
import { hrefForListing } from '@/app/(marketplace)/libs/links';
import { categories } from '@/app/(marketplace)/components/navbar/Categories';
import CountrySearchSelect, {
  type CountrySelectValue,
} from '@/app/(marketplace)/components/inputs/CountrySearchSelect';

interface ListingsMapOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialListings: SafeListing[];
  highlightedListingId?: string | null;
  highlightedCoords?: L.LatLngTuple | null;
  highlightedLabel?: string | null;
  highlightedIcon?: L.Icon | L.DivIcon;
  initialUserLocation?: L.LatLngTuple | null;
  startNearbyOnly?: boolean;
}

const DEFAULT_CENTER: L.LatLngTuple = [41.8719, 12.5674];
const PAGE_SIZE = 100;
const MAX_FETCHED = 500;
const NEARBY_RADIUS_KM = 30;
const DESCRIPTION_MAX_CHARS = 180;
const SUGGESTION_DESCRIPTION_MAX_CHARS = 150;
const DEFAULT_MARKER_COLOR = '#2200ffff';
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg)$/i;
const CITY_ZOOM = 10;

const buildHighlightIcon = () =>
  L.divIcon({
    className: 'listing-highlight-icon',
    html: `
      <svg width="38" height="38" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 4C16.3 4 10 10.3 10 18c0 10.5 14 26 14 26s14-15.5 14-26c0-7.7-6.3-14-14-14Z" fill="#facc15"/>
        <circle cx="24" cy="18" r="6.5" fill="#0f172a"/>
        <circle cx="24" cy="18" r="3.5" fill="#facc15"/>
      </svg>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 36],
    popupAnchor: [0, -30],
  });

const buildTagIcon = (color: string) =>
  L.divIcon({
    className: 'listing-tag-icon',
    html: `
      <svg width="34" height="34" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.2 7h16.6c1.1 0 2.1.4 2.9 1.2l9.1 9.1c1.6 1.6 1.6 4.2 0 5.8L25.1 39.8c-1.6 1.6-4.2 1.6-5.8 0L7.1 27.7c-.8-.8-1.2-1.8-1.2-2.9V11.2C5.9 9 7.8 7 10 7h3.2z" fill="${color}"/>
        <circle cx="25.2" cy="18.6" r="4.2" fill="white" fill-opacity="0.85"/>
      </svg>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  });

const buildUserIcon = () =>
  L.divIcon({
    className: 'user-location-icon',
    html: `
      <svg width="26" height="26" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="12" fill="#0f172a" />
        <circle cx="24" cy="24" r="7" fill="#38bdf8" />
      </svg>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const MapUpdater = ({
  center,
  zoom,
}: {
  center: L.LatLngTuple;
  zoom?: number;
}) => {
  const map = useMap();

  useEffect(() => {
    const nextZoom = zoom ?? Math.max(map.getZoom(), 10);
    map.setView(center, nextZoom, { animate: true });
  }, [center, map, zoom]);

  return null;
};

const MapReady = ({ onReady }: { onReady: (map: L.Map) => void }) => {
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
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-800 shadow-lg"
    >
      <FiPlus />
    </button>
    <button
      type="button"
      onClick={onZoomOut}
      aria-label="Zoom out"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-800 shadow-lg"
    >
      <FiMinus />
    </button>
  </div>
);

const haversineKm = (a: L.LatLngTuple, b: L.LatLngTuple) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

const getListingImages = (listing: SafeListing) => {
  const sources = Array.isArray(listing.imageSrc) ? listing.imageSrc : [];
  return sources.filter((src) => !VIDEO_EXTENSIONS.test(src));
};

const buildListingSnippet = (listing: SafeListing, maxChars: number = DESCRIPTION_MAX_CHARS) => {
  const raw = `${listing.description ?? ''}`.replace(/\s+/g, ' ').trim();
  if (!raw) return 'A thoughtful, tailored experience shaped around your pace and style.';
  if (raw.length <= maxChars) return raw;
  return `${raw.slice(0, maxChars).trimEnd()}…`;
};

const getRandomMarkerColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue} 78% 52%)`;
};

const getInitials = (value?: string | null) => {
  if (!value) return '??';
  return value
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const listingMediaSliderSettings = {
  infinite: true,
  speed: 500,
  autoplay: true,
  autoplaySpeed: 3200,
  slidesToShow: 1,
  slidesToScroll: 1,
  arrows: false,
  dots: true,
  swipeToSlide: true,
  touchMove: true,
  mobileFirst: true,
  responsive: [
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 1,
      },
    },
    {
      breakpoint: 9999,
      settings: {
        slidesToShow: 1,
      },
    },
  ],
};

const ListingMediaSlider = ({
  images,
  title,
  className,
}: {
  images: string[];
  title: string;
  className?: string;
}) => {
  const safeImages = images.length > 0 ? images : ['/placeholder.jpg'];

  return (
    <div className={clsx('overflow-hidden rounded-2xl', className)}>
      <Slider {...listingMediaSliderSettings}>
        {safeImages.map((src, index) => (
          <div key={`${title}-${index}`} className="relative h-52 w-full sm:h-56">
            <Image
              src={src}
              alt={title}
              fill
              sizes="(max-width: 640px) 90vw, 480px"
              className="object-cover"
            />
          </div>
          ))}
      </Slider>
    </div>
  );
};

const ListingsMapOverlay = ({
  isOpen,
  onClose,
  initialListings,
  highlightedListingId,
  highlightedCoords,
  highlightedLabel,
  highlightedIcon,
  initialUserLocation,
  startNearbyOnly = false,
}: ListingsMapOverlayProps) => {
  const [listings, setListings] = useState<SafeListing[]>(initialListings);
  const [loadingListings, setLoadingListings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [markerColors, setMarkerColors] = useState<Record<string, string>>({});
  const [userLocation, setUserLocation] = useState<L.LatLngTuple | null>(initialUserLocation ?? null);
  const [nearbyOnly, setNearbyOnly] = useState(startNearbyOnly);
  const [coordsMap, setCoordsMap] = useState<Record<string, L.LatLngTuple>>({});
  const [showResults, setShowResults] = useState(true);
  const [searchByCity, setSearchByCity] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<CountrySelectValue | null>(null);
  const [resolvedCityCoords, setResolvedCityCoords] = useState<L.LatLngTuple | null>(null);

  const hasFetchedRef = useRef(false);
  const coordsMapRef = useRef<Record<string, L.LatLngTuple>>({});
  const pendingLookupRef = useRef<Set<string>>(new Set());
  const mapRef = useRef<L.Map | null>(null);

  const { getByValue } = useCountries();
  const categoryIconMap = useMemo(
    () => new Map(categories.map((category) => [category.label, category.icon])),
    [],
  );

  useEffect(() => {
    coordsMapRef.current = coordsMap;
  }, [coordsMap]);

  useEffect(() => {
    if (!isOpen) return;
    if (!highlightedListingId) return;
    setSelectedListingId(highlightedListingId);
  }, [highlightedListingId, isOpen]);

  useEffect(() => {
    if (!searchByCity || !selectedLocation) return;
    setShowResults(false);
  }, [searchByCity, selectedLocation]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialUserLocation) {
      setUserLocation(initialUserLocation);
      if (startNearbyOnly) {
        setNearbyOnly(true);
      }
    }
  }, [initialUserLocation, isOpen, startNearbyOnly]);

  useEffect(() => {
    if (!isOpen) return;
    if (hasFetchedRef.current || loadingListings) return;

    const fetchListings = async () => {
      setLoadingListings(true);
      const allListings: SafeListing[] = [];

      try {
        for (let skip = 0; skip <= MAX_FETCHED; skip += PAGE_SIZE) {
          const res = await fetch(`/api/listings?take=${PAGE_SIZE}&skip=${skip}`);
          if (!res.ok) break;
          const data = (await res.json()) as SafeListing[];
          allListings.push(...data);
          if (data.length < PAGE_SIZE) break;
        }
      } finally {
        setLoadingListings(false);
      }

      const deduped = new Map<string, SafeListing>();
      [...initialListings, ...allListings].forEach((listing) => {
        deduped.set(listing.id, listing);
      });
      setListings(Array.from(deduped.values()));
      hasFetchedRef.current = true;
    };

    fetchListings();
  }, [initialListings, isOpen, loadingListings]);

  const resolveListingQuery = useCallback(
    (listing: SafeListing) => listing.meetingPoint || listing.locationDescription || listing.locationValue,
    [],
  );

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const resolveCoords = async () => {
      for (const listing of listings) {
        if (cancelled) return;
        if (coordsMapRef.current[listing.id]) continue;
        if (pendingLookupRef.current.has(listing.id)) continue;

        const fallback = listing.locationValue ? getByValue(listing.locationValue) : undefined;
        if (fallback?.latlng?.length === 2) {
          const tuple: L.LatLngTuple = [fallback.latlng[0], fallback.latlng[1]];
          setCoordsMap((prev) => (prev[listing.id] ? prev : { ...prev, [listing.id]: tuple }));
        }

        const query = resolveListingQuery(listing);
        if (!query) continue;

        pendingLookupRef.current.add(listing.id);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=en&q=${encodeURIComponent(query)}`,
          );
          if (!res.ok) continue;
          const data = (await res.json()) as Array<{ lat: string; lon: string }>;
          if (data[0]?.lat && data[0]?.lon) {
            const tuple: L.LatLngTuple = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            setCoordsMap((prev) => ({ ...prev, [listing.id]: tuple }));
          }
        } catch (error) {
          console.warn('Failed to resolve listing coordinates', error);
        } finally {
          pendingLookupRef.current.delete(listing.id);
          await delay(120);
        }
      }
    };

    resolveCoords();

    return () => {
      cancelled = true;
    };
  }, [getByValue, isOpen, listings, resolveListingQuery]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const locationTokens = useMemo(() => {
    if (!selectedLocation) return [];
    return [selectedLocation.city, selectedLocation.label, selectedLocation.region]
      .filter(Boolean)
      .map((token) => token!.toLowerCase().trim())
      .filter(Boolean);
  }, [selectedLocation]);

  const filteredListings = useMemo(() => {
    const matchesQuery = (listing: SafeListing) => {
      if (searchByCity) {
        const cityTokens = [
          listing.locationDescription,
          listing.locationValue,
          listing.meetingPoint,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!locationTokens.length) return false;
        return locationTokens.some((token) => cityTokens.includes(token));
      }
      if (!normalizedQuery) return true;
      const tokens = [
        listing.title,
        listing.primaryCategory,
        listing.locationValue,
        listing.locationDescription,
        listing.meetingPoint,
        ...(listing.category || []),
        ...(listing.seoKeywords || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return tokens.includes(normalizedQuery);
    };

    const matchesLocation = (listing: SafeListing) => {
      if (!nearbyOnly || !userLocation) return true;
      const coords = coordsMap[listing.id];
      if (!coords) return false;
      return haversineKm(userLocation, coords) <= NEARBY_RADIUS_KM;
    };

    return listings.filter((listing) => matchesQuery(listing) && matchesLocation(listing));
  }, [coordsMap, listings, locationTokens, nearbyOnly, normalizedQuery, searchByCity, userLocation]);

  const suggestions = useMemo(
    () =>
      filteredListings.slice(0, normalizedQuery || nearbyOnly || (searchByCity && locationTokens.length) ? 8 : 0),
    [filteredListings, locationTokens.length, nearbyOnly, normalizedQuery, searchByCity],
  );

  const activeCenter = useMemo(() => {
    if (searchByCity && resolvedCityCoords) {
      return resolvedCityCoords;
    }
    if (searchByCity && selectedLocation?.latlng?.length === 2) {
      return [selectedLocation.latlng[0], selectedLocation.latlng[1]] as L.LatLngTuple;
    }
    if (highlightedCoords) return highlightedCoords;
    if (selectedListingId && coordsMap[selectedListingId]) {
      return coordsMap[selectedListingId];
    }
    if (userLocation) return userLocation;
    const firstListing = filteredListings.find((listing) => coordsMap[listing.id]);
    return firstListing ? coordsMap[firstListing.id] : DEFAULT_CENTER;
  }, [
    coordsMap,
    filteredListings,
    highlightedCoords,
    searchByCity,
    selectedListingId,
    selectedLocation,
    userLocation,
  ]);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) ?? null,
    [listings, selectedListingId],
  );

  const getListingMarkerColor = useCallback(
    (listingId: string) => markerColors[listingId] ?? DEFAULT_MARKER_COLOR,
    [markerColors],
  );

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoords: L.LatLngTuple = [position.coords.latitude, position.coords.longitude];
        setUserLocation(nextCoords);
        setNearbyOnly(true);
        const map = getActiveMap();
        if (map) {
          map.setView(nextCoords, 12, { animate: true });
        }
      },
      () => {
        setNearbyOnly(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const getActiveMap = useCallback(() => {
    const map = mapRef.current;
    if (!map) return null;
    const container = map.getContainer?.();
    if (!container || !container.isConnected) return null;
    const { _loaded } = map as L.Map & { _loaded?: boolean };
    if (_loaded === false) return null;
    return map;
  }, []);

  const handleMapReady = useCallback((mapInstance: L.Map) => {
    mapRef.current = mapInstance;
  }, []);

  const handleZoomIn = () => {
    const map = getActiveMap();
    if (map) {
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    const map = getActiveMap();
    if (map) {
      map.zoomOut();
    }
  };

  const stopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  const handleResultClick = (listing: SafeListing) => {
    setSelectedListingId(listing.id);
    setShowResults(false);
    setMarkerColors((prev) => ({
      ...prev,
      [listing.id]: getRandomMarkerColor(),
    }));
    const coords = coordsMap[listing.id];
    if (coords) {
      const map = getActiveMap();
      if (map) {
        map.setView(coords, 12, { animate: true });
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (!searchByCity || !selectedLocation?.latlng?.length) return;
    const map = getActiveMap();
    if (map) {
      const targetCoords =
        resolvedCityCoords ?? ([selectedLocation.latlng[0], selectedLocation.latlng[1]] as L.LatLngTuple);
      map.setView(
        targetCoords,
        CITY_ZOOM,
        { animate: true },
      );
    }
  }, [getActiveMap, isOpen, resolvedCityCoords, searchByCity, selectedLocation]);
useEffect(() => {
    if (!isOpen) return;
    if (!searchByCity || !selectedLocation) {
      setResolvedCityCoords(null);
      return;
    }

    const query = [selectedLocation.city, selectedLocation.label]
      .filter(Boolean)
      .join(', ')
      .trim();

    if (!query) {
      setResolvedCityCoords(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const resolveCityCoords = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=en&q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (data[0]?.lat && data[0]?.lon) {
          const tuple: L.LatLngTuple = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          if (!cancelled) {
            setResolvedCityCoords(tuple);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to resolve selected city coordinates', error);
        }
      }
    };

    resolveCityCoords();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isOpen, searchByCity, selectedLocation]);

  useEffect(() => {
    if (!isOpen) {
      mapRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white"
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onTouchStart={stopPropagation}
      >
      <div className="absolute inset-0">
        <MapContainer
          center={activeCenter}
          zoom={10}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            // attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapReady onReady={handleMapReady} />
          <MapUpdater
            center={activeCenter}
            zoom={searchByCity && selectedLocation?.latlng?.length === 2 ? CITY_ZOOM : undefined}
          />
          {highlightedCoords && (
            <Marker position={highlightedCoords} icon={highlightedIcon ?? buildHighlightIcon()}>
              {highlightedLabel && (
                <Popup>
                  <div className="text-sm font-semibold text-neutral-800">{highlightedLabel}</div>
                </Popup>
              )}
            </Marker>
          )}
          {filteredListings.map((listing) => {
            const coords = coordsMap[listing.id];
            if (!coords) return null;
            if (highlightedListingId && listing.id === highlightedListingId) return null;
            const listingHref = hrefForListing(listing);
            return (
              <Marker
                key={listing.id}
                position={coords}
                icon={buildTagIcon(getListingMarkerColor(listing.id))}
                eventHandlers={{
                  click: () => {
                    setSelectedListingId(listing.id);
                    setMarkerColors((prev) => ({
                      ...prev,
                      [listing.id]: getRandomMarkerColor(),
                    }));
                  },
                }}
              >
                {/* <Popup>
                  <div className="space-y-1 text-sm">
                    <Link
                      href={listingHref}
                      className="block truncate font-semibold text-neutral-700 transition hover:text-neutral-900"
                    >
                      {listing.title}
                    </Link>
                    <div className="text-xs text-neutral-500">
                      {(listing.primaryCategory || listing.category?.[0] || 'Service').toString()}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {listing.meetingPoint || listing.locationDescription || listing.locationValue}
                    </div>
                  </div>
                </Popup> */}
              </Marker>
            );
          })}
          {userLocation && (
            <Marker position={userLocation} icon={buildUserIcon()}>
              <Popup>
                <div className="text-sm font-medium text-neutral-900">Your location</div>
                <div className="text-xs text-neutral-500">
                  Showing listings within {NEARBY_RADIUS_KM} km
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
        <MapZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 bottom-10 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg"
        aria-label="Close map"
      >
        <IoClose size={18} />
      </button>

      {selectedListing && (
        <div className="absolute bottom-6 left-1/2 z-20 w-[92vw] max-w-xl -translate-x-1/2">
          <div className="rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {(selectedListing.primaryCategory ||
                      selectedListing.category?.[0] ||
                      'Service')?.toString()}
                  </span>
                  <span className="truncate">
                    {(
                      selectedListing.locationDescription ||
                      selectedListing.locationValue ||
                      selectedListing.meetingPoint ||
                      ''
                    ).toString()}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-neutral-500">
                  <Link
                    href={hrefForListing(selectedListing)}
                    className="block truncate font-semibold text-neutral-700 transition hover:text-neutral-900"
                  >
                    {selectedListing.title}
                  </Link>
                  <p className="text-sm leading-relaxed text-neutral-500 line-clamp-2">
                    {buildListingSnippet(selectedListing)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <span className="flex items-center gap-1 font-semibold text-neutral-700">
                      <span className="text-blue-800">★</span>
                      {typeof selectedListing.avgRating === 'number'
                        ? selectedListing.avgRating.toFixed(1)
                        : 'New'}
                    </span>
                    <span className="text-neutral-400">·</span>
                    <span>
                      {(selectedListing.reviewsCount ?? 0).toLocaleString()} review
                      {(selectedListing.reviewsCount ?? 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedListingId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-800"
                aria-label="Close listing preview"
              >
                <IoClose size={16} />
              </button>
            </div>
            <Link
              href={hrefForListing(selectedListing)}
              className="mt-3 block"
            >
              <ListingMediaSlider
                images={getListingImages(selectedListing)}
                title={selectedListing.title}
              />
            </Link>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-4 px-4 py-4 sm:px-8">
       <div className="flex w-full max-w-3xl flex-col gap-3 rounded-2xl bg-white/10 p-3 shadow-lg backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="px-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Search mode
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchByCity((prev) => {
                  const next = !prev;
                  setShowResults(next ? false : true);
                  return next;
                });
                setSearchQuery('');
                setSelectedLocation(null);
              }}
              className={clsx(
                'relative flex items-center gap-3 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition',
                searchByCity ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-neutral-200 bg-white text-blue-700',
              )}
            >
              <span className={clsx('transition', searchByCity && 'text-neutral-400')}>
                Services
              </span>
              <div
                className={clsx(
                  'relative h-6 w-12 overflow-hidden rounded-full transition',
                  searchByCity ? 'bg-blue-600' : 'border-neutral-200 bg-neutral-100',
                )}
              >
                <motion.span
                  className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow"
                  animate={{ x: searchByCity ? 24 : 0 }}
                  transition={{ duration: 0.25 }}
                />
              </div>
              <span className={clsx('transition', !searchByCity && 'text-neutral-400')}>
                Location
              </span>
            </button>
          </div>
          <div className="flex w-full items-start gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <AnimatePresence mode="wait">
                {searchByCity ? (
                  <motion.div
                    key="location-search"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <CountrySearchSelect
                      value={selectedLocation}
                      onChange={(value) => {
                        setSelectedLocation(value ?? null);
                        setSearchQuery(value?.label ?? '');
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="service-search"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="relative flex items-center"
                  >
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by title, category, or keyword"
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 pr-18 text-sm text-neutral-900 shadow-sm focus:border-neutral-400 focus:outline-none"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleUseLocation}
                        className="flex h-8 w-8 items-center justify-center bg-white text-neutral-700"
                        aria-label="Use current location"
                      >
                        <LuLocateFixed className="text-neutral-700" />
                      </button>
                      {/* <button
                        type="button"
                        onClick={() => setNearbyOnly((prev) => !prev)}
                        className={clsx(
                          'flex h-8 items-center rounded-full border px-3 text-[10px] font-semibold uppercase tracking-wide transition',
                          nearbyOnly
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-neutral-200 bg-white text-neutral-500',
                        )}
                      >
                        Nearby
                      </button> */}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false}>
                {(suggestions.length > 0 || nearbyOnly) && showResults && (
                  <motion.div
                    key="listing-results"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-[25vh] overflow-y-auto rounded-xl border border-neutral-100 bg-white shadow-sm shadow-inner">
                      {suggestions.length === 0 && nearbyOnly ? (
                        <div className="px-4 py-3 text-xs text-neutral-500">
                          No nearby listings found within {NEARBY_RADIUS_KM} km.
                        </div>
                      ) : (
                        suggestions.map((listing) => {
                          const providerName = listing.user?.name ?? 'Provider';
                          const providerImage = listing.user?.image ?? '';
                          const categoryLabel = (listing.primaryCategory || listing.category?.[0] || '').toString();
                          const CategoryIcon = categoryIconMap.get(categoryLabel);
                          return (
                            <button
                              key={listing.id}
                              type="button"
                              onClick={() => handleResultClick(listing)}
                              className={clsx(
                                'relative w-full border-b border-neutral-100 p-3 text-left transition hover:bg-neutral-50',
                                selectedListingId === listing.id && 'bg-neutral-50',
                              )}
                             >
                              <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
                                  {providerImage ? (
                                    <Image
                                      src={providerImage}
                                      alt={providerName}
                                      width={44}
                                      height={44}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span>{getInitials(providerName)}</span>
                                  )}
                                </div>
                                <div className="flex flex-1 flex-col gap-1">
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                                    <span className="font-semibold text-neutral-700">{providerName}</span>
                                    <span className="text-blue-800">★</span>
                                    <span>
                                      {typeof listing.avgRating === 'number'
                                        ? listing.avgRating.toFixed(1)
                                        : 'New'}
                                    </span>
                                    <span className="text-neutral-300">|</span>
                                    <span>
                                      {(listing.reviewsCount ?? 0).toLocaleString()} review
                                      {(listing.reviewsCount ?? 0) === 1 ? '' : 's'}
                                    </span>
                                    <span className="text-neutral-300">|</span>
                                    <span>
                                      {(listing.bookingCount ?? 0).toLocaleString()} booking
                                      {(listing.bookingCount ?? 0) === 1 ? '' : 's'}
                                    </span>
                                  </div>
                                  <p className="text-sm font-semibold text-neutral-900">
                                    {listing.title}
                                  </p>
                                  {categoryLabel && (
                                    <span className="inline-flex w-fit items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 shadow-sm">
                                      {CategoryIcon && <CategoryIcon className="h-3 w-3" aria-hidden />}
                                      <span>{categoryLabel}</span>
                                    </span>
                                  )}
                                  <p className="text-xs text-neutral-500 line-clamp-2">
                                    {buildListingSnippet(listing, SUGGESTION_DESCRIPTION_MAX_CHARS)}
                                  </p>
                                </div>
                              </div>
                              </button>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* <div className="flex w-full items-center justify-between rounded-2xl bg-white/90 px-4 py-3 text-xs text-neutral-600 shadow-sm backdrop-blur">
                <div>
                  {filteredListings.length} listing{filteredListings.length === 1 ? '' : 's'} on map
                  {nearbyOnly && userLocation ? ` within ${NEARBY_RADIUS_KM} km` : ''}
                  {loadingListings ? ' · Fetching more results…' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                    Activities
                  </span>
                  <span
                    className="h-4 w-4 rounded-full border border-neutral-200"
                    style={{ backgroundColor: DEFAULT_MARKER_COLOR }}
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => setMarkerColors({})}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600 transition hover:border-neutral-300"
                  >
                    Reset
                  </button>
                </div>
              </div> */}
            </div>
            {!searchByCity && (
              <button
                type="button"
                onClick={() => setShowResults((prev) => !prev)}
                className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300"
                aria-label={showResults ? 'Collapse results' : 'Expand results'}
              >
                <motion.div
                  animate={{ rotate: showResults ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                   <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-black"
                  >
                    <path
                      d="M6 14l6-6 6 6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              </button>
            )}
          </div>
          <div className="flex w-full max-w-3xl items-center justify-between rounded-2xl bg-white/90 px-4 py-3 text-xs font-semibold text-neutral-600 shadow-sm backdrop-blur">
          <div>
            {filteredListings.length} Listing{filteredListings.length === 1 ? '' : 's'}
            {nearbyOnly && userLocation ? ` within ${NEARBY_RADIUS_KM} km` : ''}
            {loadingListings ? ' · Fetching more results…' : ''}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Pin
            </span>
            <span
              className="h-4 w-4 rounded-full border border-neutral-200"
              style={{ backgroundColor: DEFAULT_MARKER_COLOR }}
              aria-hidden
            />
            <button
              type="button"
              onClick={() => setMarkerColors({})}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600 transition hover:border-neutral-300"
            >
              Reset
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ListingsMapOverlay;