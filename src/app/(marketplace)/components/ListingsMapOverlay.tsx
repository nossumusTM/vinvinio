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

import type { SafeListing } from '@/app/(marketplace)/types';
import useCountries from '@/app/(marketplace)/hooks/useCountries';
import { hrefForListing } from '@/app/(marketplace)/libs/links';

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
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg)$/i;

const COLOR_OPTIONS = [
  { label: 'Ocean', value: '#2563eb' },
  { label: 'Forest', value: '#15803d' },
  { label: 'Sunset', value: '#f97316' },
];

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

const MapUpdater = ({ center }: { center: L.LatLngTuple }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 10), { animate: true });
  }, [center, map]);

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
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/30 text-neutral-800 shadow-lg backdrop-blur transition"
    >
      <FiPlus />
    </button>
    <button
      type="button"
      onClick={onZoomOut}
      aria-label="Zoom out"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/30 text-neutral-800 shadow-lg backdrop-blur transition"
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

const buildListingSnippet = (listing: SafeListing) => {
  const raw = `${listing.description ?? ''}`.replace(/\s+/g, ' ').trim();
  if (!raw) return 'A thoughtful, tailored experience shaped around your pace and style.';
  if (raw.length <= DESCRIPTION_MAX_CHARS) return raw;
  return `${raw.slice(0, DESCRIPTION_MAX_CHARS).trimEnd()}…`;
};

const ListingImageSlider = ({
  images,
  title,
  className,
  imageClassName,
  showIndicators = true,
}: {
  images: string[];
  title: string;
  className?: string;
  imageClassName?: string;
  showIndicators?: boolean;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeImages = images.length > 0 ? images : ['/placeholder.jpg'];

  useEffect(() => {
    setActiveIndex(0);
  }, [images.length]);

  const handlePrev = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };

  const handleNext = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % safeImages.length);
  };

  return (
    <div className={clsx('relative overflow-hidden rounded-xl bg-neutral-100', className)}>
      <Image
        src={safeImages[activeIndex]}
        alt={title}
        fill
        sizes="(max-width: 640px) 80vw, 320px"
        className={clsx('object-cover', imageClassName)}
      />
      {safeImages.length > 1 && (
        <>
          <div className="absolute inset-0 flex items-center justify-between px-2">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white transition hover:bg-black/50"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white transition hover:bg-black/50"
            >
              ›
            </button>
          </div>
          {showIndicators && (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {safeImages.map((_, index) => (
                <span
                  key={`${title}-dot-${index}`}
                  className={clsx(
                    'h-1.5 w-1.5 rounded-full bg-white/60',
                    index === activeIndex && 'bg-white',
                  )}
                />
              ))}
            </div>
          )}
        </>
      )}
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
  const [markerColor, setMarkerColor] = useState(COLOR_OPTIONS[0].value);
  const [userLocation, setUserLocation] = useState<L.LatLngTuple | null>(initialUserLocation ?? null);
  const [nearbyOnly, setNearbyOnly] = useState(startNearbyOnly);
  const [coordsMap, setCoordsMap] = useState<Record<string, L.LatLngTuple>>({});

  const hasFetchedRef = useRef(false);
  const coordsMapRef = useRef<Record<string, L.LatLngTuple>>({});
  const pendingLookupRef = useRef<Set<string>>(new Set());
  const mapRef = useRef<L.Map | null>(null);

  const { getByValue } = useCountries();

  useEffect(() => {
    coordsMapRef.current = coordsMap;
  }, [coordsMap]);

  useEffect(() => {
    if (!isOpen) return;
    if (!highlightedListingId) return;
    setSelectedListingId(highlightedListingId);
  }, [highlightedListingId, isOpen]);

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

  const filteredListings = useMemo(() => {
    const matchesQuery = (listing: SafeListing) => {
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
  }, [coordsMap, listings, nearbyOnly, normalizedQuery, userLocation]);

  const suggestions = useMemo(
    () => filteredListings.slice(0, normalizedQuery || nearbyOnly ? 8 : 0),
    [filteredListings, nearbyOnly, normalizedQuery],
  );

  const activeCenter = useMemo(() => {
    if (highlightedCoords) return highlightedCoords;
    if (selectedListingId && coordsMap[selectedListingId]) {
      return coordsMap[selectedListingId];
    }
    if (userLocation) return userLocation;
    const firstListing = filteredListings.find((listing) => coordsMap[listing.id]);
    return firstListing ? coordsMap[firstListing.id] : DEFAULT_CENTER;
  }, [coordsMap, filteredListings, highlightedCoords, selectedListingId, userLocation]);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) ?? null,
    [listings, selectedListingId],
  );

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoords: L.LatLngTuple = [position.coords.latitude, position.coords.longitude];
        setUserLocation(nextCoords);
        setNearbyOnly(true);
        mapRef.current?.setView(nextCoords, 12, { animate: true });
      },
      () => {
        setNearbyOnly(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleMapReady = useCallback((mapInstance: L.Map) => {
    mapRef.current = mapInstance;
  }, []);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
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
          <MapUpdater center={activeCenter} />
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
            const listingHref = hrefForListing(listing);
            return (
              <Marker
                key={listing.id}
                position={coords}
                icon={buildTagIcon(markerColor)}
                eventHandlers={{
                  click: () => {
                    setSelectedListingId(listing.id);
                  },
                }}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <Link
                      href={listingHref}
                      className="font-semibold text-neutral-600 transition hover:text-neutral-800"
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
                </Popup>
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

      {selectedListing && (
        <div className="absolute bottom-6 left-1/2 z-20 w-[92vw] max-w-xl -translate-x-1/2">
          <div className="rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
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
                <p className="text-sm leading-relaxed text-neutral-500 line-clamp-2">
                  <Link
                    href={hrefForListing(selectedListing)}
                    className="font-semibold text-neutral-600 transition hover:text-neutral-800"
                  >
                    {selectedListing.title}
                  </Link>
                  <span className="text-neutral-400"> · </span>
                  <span>{buildListingSnippet(selectedListing)}</span>
                </p>
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
              <ListingImageSlider
                images={getListingImages(selectedListing)}
                title={selectedListing.title}
                className="h-48 w-full"
                imageClassName="rounded-xl"
              />
            </Link>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-4 px-4 py-4 sm:px-8">
        <div className="flex w-full max-w-3xl items-center gap-3 rounded-2xl bg-white/90 p-3 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white"
            aria-label="Close map"
          >
            <IoClose size={18} />
          </button>
          <div className="flex flex-1 flex-col gap-2">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search services by title, category, or keyword"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 shadow-sm focus:border-neutral-400 focus:outline-none"
            />
            {(suggestions.length > 0 || nearbyOnly) && (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-neutral-100 bg-white shadow-sm">
                {suggestions.length === 0 && nearbyOnly ? (
                  <div className="px-4 py-3 text-xs text-neutral-500">
                    No nearby listings found within {NEARBY_RADIUS_KM} km.
                  </div>
                ) : (
                  suggestions.map((listing) => {
                    const listingHref = hrefForListing(listing);
                    const listingImages = getListingImages(listing);
                    return (
                      <div
                        key={listing.id}
                        className={clsx(
                          'flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3 text-left text-sm transition hover:bg-neutral-50',
                          selectedListingId === listing.id && 'bg-neutral-50',
                        )}
                      >
                        <Link
                          href={listingHref}
                          className="shrink-0"
                        >
                          <ListingImageSlider
                            images={listingImages}
                            title={listing.title}
                            className="h-20 w-28"
                            imageClassName="rounded-lg"
                            showIndicators={false}
                          />
                        </Link>
                        <div className="flex flex-1 flex-col gap-1">
                          <span className="text-xs text-neutral-500">
                            {(listing.primaryCategory || listing.category?.[0] || 'Service').toString()} ·{' '}
                            {(listing.locationDescription || listing.locationValue || '').toString()}
                          </span>
                          <p className="text-[11px] leading-relaxed text-neutral-500 line-clamp-2">
                            <Link
                              href={listingHref}
                              className="font-semibold text-neutral-600 transition hover:text-neutral-800"
                            >
                              {listing.title}
                            </Link>
                            <span className="text-neutral-400"> · </span>
                            <span>{buildListingSnippet(listing)}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedListingId(listing.id);
                            const coords = coordsMap[listing.id];
                            if (coords) {
                              mapRef.current?.setView(coords, 12, { animate: true });
                            }
                          }}
                          className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600 transition hover:border-neutral-300"
                        >
                          Focus
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          <div className="flex flex-row items-end gap-2">
            <button
              type="button"
              onClick={handleUseLocation}
              className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 shadow-sm hover:border-neutral-300"
            >
              <LuLocateFixed className="text-neutral-700" />
            </button>
            <button
              type="button"
              onClick={() => setNearbyOnly((prev) => !prev)}
              className={clsx(
                'rounded-2xl border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition',
                nearbyOnly
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-neutral-200 bg-white text-neutral-500',
              )}
            >
              {nearbyOnly ? 'Nearby' : 'Nearby'}
            </button>
          </div>
        </div>
        <div className="flex w-full max-w-3xl items-center justify-between rounded-2xl bg-white/90 px-4 py-3 text-xs text-neutral-600 shadow-sm backdrop-blur">
          <div>
            {filteredListings.length} listing{filteredListings.length === 1 ? '' : 's'} on map
            {nearbyOnly && userLocation ? ` within ${NEARBY_RADIUS_KM} km` : ''}
            {loadingListings ? ' · Fetching more results…' : ''}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Tag color
            </span>
            {COLOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-label={`Set tag color ${option.label}`}
                className={clsx(
                  'h-5 w-5 rounded-full border-2 transition',
                  markerColor === option.value ? 'border-neutral-900' : 'border-transparent',
                )}
                style={{ backgroundColor: option.value }}
                onClick={() => setMarkerColor(option.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingsMapOverlay;