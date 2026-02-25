'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import L from 'leaflet';
import Image from 'next/image';
import Link from 'next/link';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { IoClose } from 'react-icons/io5';
import { LuLocateFixed, LuTag } from 'react-icons/lu';
import type { IconType } from 'react-icons';
import { FiChevronLeft, FiChevronRight, FiMinus, FiPlus } from 'react-icons/fi';
import clsx from 'clsx';
import Slider from 'react-slick';
import type { Settings } from 'react-slick';
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
  embedded?: boolean;
  className?: string;
}

const DEFAULT_CENTER: L.LatLngTuple = [41.8719, 12.5674];
const PAGE_SIZE = 10;
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

const buildCategoryIcon = (Icon: IconType, color: string, size: number) =>
  L.divIcon({
    className: 'listing-category-icon',
    html: renderToStaticMarkup(
      <div className="flex items-center justify-center">
        <div
          className="flex items-center justify-center rounded-full shadow-lg ring-2 ring-white/70"
          style={{ backgroundColor: color, width: size, height: size }}
        >
          <Icon
            className="text-white drop-shadow"
            style={{
              width: Math.max(14, Math.round(size * 0.46)),
              height: Math.max(14, Math.round(size * 0.46)),
            }}
          />
        </div>
      </div>,
    ),
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -Math.round(size * 0.8)],
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

const MapZoomWatcher = ({ onZoomChange }: { onZoomChange: (zoom: number) => void }) => {
  const map = useMap();

  useEffect(() => {
    const syncZoom = () => {
      onZoomChange(map.getZoom());
    };

    syncZoom();
    map.on('zoomend', syncZoom);

    return () => {
      map.off('zoomend', syncZoom);
    };
  }, [map, onZoomChange]);

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
  if (!raw) return 'A thoughtful, tailored service shaped around your pace and style.';
  if (raw.length <= maxChars) return raw;
  return `${raw.slice(0, maxChars).trimEnd()}…`;
};

const resolveListingCategoryIcon = (listing: SafeListing) => {
  const label = (listing.primaryCategory || listing.category?.[0] || '').toString();
  if (!label) return LuTag;
  const match = categories.find(
    (category) => category.label.toLowerCase() === label.toLowerCase(),
  );
  return match?.icon ?? LuTag;
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

const slugifyToken = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

type ListingSliderArrowProps = {
  className?: string;
  onClick?: () => void;
  direction: 'next' | 'prev';
};

const ListingSliderArrow = ({ className, onClick, direction }: ListingSliderArrowProps) => {
  const isDisabled = className?.includes('slick-disabled');
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-label={direction === 'next' ? 'Next image' : 'Previous image'}
      className={clsx(
        'absolute top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white p-0 shadow-md hover:bg-white sm:h-9 sm:w-9',
        direction === 'next' ? 'right-3' : 'left-3',
        isDisabled && 'cursor-not-allowed opacity-50',
      )}
      style={{ display: 'flex' }}
    >
      <span className="sr-only">{direction === 'next' ? 'Next image' : 'Previous image'}</span>
      {direction === 'next' ? (
        <FiChevronRight className="h-4 w-4 text-black" />
      ) : (
        <FiChevronLeft className="h-4 w-4 text-black" />
      )}
    </button>
  );
};

const listingMediaSliderSettings: Settings = {
  infinite: true,
  speed: 420,
  autoplay: true,
  autoplaySpeed: 3200,
  fade: true,
  cssEase: 'ease-in-out',
  slidesToShow: 1,
  slidesToScroll: 1,
  arrows: true,
  dots: true,
  swipeToSlide: true,
  touchMove: true,
  nextArrow: <ListingSliderArrow direction="next" />,
  prevArrow: <ListingSliderArrow direction="prev" />,
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
    <>
      <div className={clsx('listing-media-slider relative overflow-hidden rounded-2xl', className)}>
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
      <style jsx global>{`
        .listing-media-slider .slick-prev:before,
        .listing-media-slider .slick-next:before {
          content: '' !important;
        }
      `}</style>
    </>
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
  embedded = false,
  className,
}: ListingsMapOverlayProps) => {
  const [listings, setListings] = useState<SafeListing[]>(initialListings);
  const [loadingListings, setLoadingListings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [markerColors, setMarkerColors] = useState<Record<string, string>>({});
  const [userLocation, setUserLocation] = useState<L.LatLngTuple | null>(initialUserLocation ?? null);
  const [nearbyOnly, setNearbyOnly] = useState(startNearbyOnly);
  const [coordsMap, setCoordsMap] = useState<Record<string, L.LatLngTuple>>({});
  const [showResults, setShowResults] = useState(false);
  const [searchByCity, setSearchByCity] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<CountrySelectValue | null>(null);
  const [resolvedCityCoords, setResolvedCityCoords] = useState<L.LatLngTuple | null>(null);
  const [hasMoreListings, setHasMoreListings] = useState(false);
  const [nextSkip, setNextSkip] = useState(0);
  const [mapZoom, setMapZoom] = useState(CITY_ZOOM);
  const [isLocating, setIsLocating] = useState(false);
  const [highlightResultsToggle, setHighlightResultsToggle] = useState(false);
  const [selectedLocationSource, setSelectedLocationSource] = useState<'manual' | 'geolocation' | null>(null);

  const coordsMapRef = useRef<Record<string, L.LatLngTuple>>({});
  const pendingLookupRef = useRef<Set<string>>(new Set());
  const mapRef = useRef<L.Map | null>(null);
  const hasAutoLocatedRef = useRef(false);
  const locationResolveSeqRef = useRef(0);
  const cityResolveSeqRef = useRef(0);
  const cityCoordsCacheRef = useRef<Record<string, L.LatLngTuple>>({});

  const { getByValue } = useCountries();
  const categoryIconMap = useMemo(
    () => new Map(categories.map((category) => [category.label, category.icon])),
    [],
  );
  const markerSize = useMemo(() => {
    const clampedZoom = Math.max(4, Math.min(18, mapZoom));
    const zoomDeltaFromCity = Math.max(0, CITY_ZOOM - clampedZoom);
    return Math.max(18, 40 - zoomDeltaFromCity * 3);
  }, [mapZoom]);

  const locationQuery = useMemo(() => {
    if (!selectedLocation) return '';

    const tokens = [
      selectedLocation.city,
      selectedLocation.label,
      selectedLocation.value,
    ]
      .map((value) => value?.trim())
      .filter(Boolean) as string[];

    return Array.from(new Set(tokens)).join(', ');
  }, [selectedLocation]);

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

  const buildLocationFromCoords = useCallback(
    async (coords: L.LatLngTuple): Promise<CountrySelectValue | null> => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=en&lat=${coords[0]}&lon=${coords[1]}`,
        );
        if (!res.ok) return null;
        const payload = (await res.json()) as {
          address?: {
            country?: string;
            country_code?: string;
            city?: string;
            town?: string;
            village?: string;
            hamlet?: string;
            municipality?: string;
          };
        };

        const address = payload.address ?? {};
        const countryCode = address.country_code?.toUpperCase();
        const country = countryCode ? getByValue(countryCode) : undefined;
        const city =
          address.city ||
          address.town ||
          address.village ||
          address.hamlet ||
          address.municipality ||
          undefined;

        const label = country?.label || address.country || '';
        if (!label) return null;

        return {
          value:
            city && countryCode
              ? `${slugifyToken(city)}-${countryCode}`
              : (countryCode ?? slugifyToken(label)),
          label,
          region: country?.region ?? label,
          flag: country?.flag ?? '',
          latlng: [coords[0], coords[1]],
          city,
        };
      } catch (error) {
        console.warn('Failed to resolve user location', error);
        return null;
      }
    },
    [getByValue],
  );

  const fetchListingsPage = useCallback(
    async ({ skip, append }: { skip: number; append: boolean }) => {
      if (!locationQuery) return;

      setLoadingListings(true);
      try {
        const params = new URLSearchParams({
          take: String(PAGE_SIZE),
          skip: String(skip),
          locationQuery,
        });
        const res = await fetch(`/api/listings?${params.toString()}`);
        if (!res.ok) {
          setHasMoreListings(false);
          return;
        }
        const data = (await res.json()) as SafeListing[];
        setHasMoreListings(data.length === PAGE_SIZE);
        setNextSkip(skip + data.length);
        if (!append) {
          setShowResults(false);
          setHighlightResultsToggle(data.length > 0);
        }
        setListings((prev) => {
          if (!append) return data;
          const deduped = new Map<string, SafeListing>();
          [...prev, ...data].forEach((listing) => {
            deduped.set(listing.id, listing);
          });
          return Array.from(deduped.values());
        });
      } finally {
        setLoadingListings(false);
      }
    },
    [locationQuery],
  );

  const applyDetectedLocation = useCallback(
    async (coords: L.LatLngTuple) => {
      const requestId = ++locationResolveSeqRef.current;
      cityResolveSeqRef.current += 1;
      setUserLocation(coords);
      setNearbyOnly(false);
      setSearchByCity(true);
      setShowResults(false);
      setResolvedCityCoords(coords);
      setSelectedLocation(null);
      setSelectedLocationSource('geolocation');
      setSelectedListingId(null);
      setHighlightResultsToggle(false);

      // Recenter immediately; do not wait for reverse-geocode response.
      const immediateMap = mapRef.current;
      if (immediateMap) {
        immediateMap.setView(coords, CITY_ZOOM, { animate: true });
      }

      const location = await buildLocationFromCoords(coords);
      if (requestId !== locationResolveSeqRef.current) return;

      if (location) {
        setSelectedLocation(location);
      }

    },
    [buildLocationFromCoords],
  );

  const requestDeviceLocation = useCallback(async (): Promise<L.LatLngTuple> => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation API unavailable');
    }

    const getCurrentPosition = (options: PositionOptions) =>
      new Promise<L.LatLngTuple>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve([position.coords.latitude, position.coords.longitude]),
          reject,
          options,
        );
      });

    const getWatchedPosition = () =>
      new Promise<L.LatLngTuple>((resolve, reject) => {
        let settled = false;
        let watchId: number | null = null;

        const resolveOnce = (coords: L.LatLngTuple) => {
          if (settled) return;
          settled = true;
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
          }
          resolve(coords);
        };

        const rejectOnce = (error: unknown) => {
          if (settled) return;
          settled = true;
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
          }
          reject(error);
        };

        const timeoutId = window.setTimeout(() => {
          rejectOnce(new Error('watchPosition timeout'));
        }, 10000);

        watchId = navigator.geolocation.watchPosition(
          (position) => {
            window.clearTimeout(timeoutId);
            resolveOnce([position.coords.latitude, position.coords.longitude]);
          },
          (error) => {
            window.clearTimeout(timeoutId);
            rejectOnce(error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      });

    const getApproximateIpLocation = async (): Promise<L.LatLngTuple | null> => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) return null;
        const data = (await res.json()) as { latitude?: number; longitude?: number };
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          return [data.latitude, data.longitude];
        }
        return null;
      } catch {
        return null;
      }
    };

    return new Promise<L.LatLngTuple>((resolve, reject) => {
      (async () => {
        try {
          const precise = await getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
          resolve(precise);
          return;
        } catch {}

        try {
          const lessStrict = await getCurrentPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
          resolve(lessStrict);
          return;
        } catch {}

        try {
          const watched = await getWatchedPosition();
          resolve(watched);
          return;
        } catch {}

        const approximate = await getApproximateIpLocation();
        if (approximate) {
          resolve(approximate);
          return;
        }

        reject(new Error('Unable to resolve device location'));
      })();
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (!locationQuery) {
      setListings([]);
      setHasMoreListings(false);
      setNextSkip(0);
      setSelectedListingId(null);
      setHighlightResultsToggle(false);
      setShowResults(false);
      return;
    }
    void fetchListingsPage({ skip: 0, append: false });
  }, [fetchListingsPage, isOpen, locationQuery]);

  useEffect(() => {
    if (isOpen) return;
    hasAutoLocatedRef.current = false;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedLocation) return;
    if (hasAutoLocatedRef.current) return;

    hasAutoLocatedRef.current = true;
    setSearchByCity(true);

    if (initialUserLocation) {
      void applyDetectedLocation(initialUserLocation);
      return;
    }

    void requestDeviceLocation()
      .then((coords) => {
        void applyDetectedLocation(coords);
      })
      .catch(() => {
        hasAutoLocatedRef.current = false;
      });
  }, [applyDetectedLocation, initialUserLocation, isOpen, requestDeviceLocation, selectedLocation]);

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
        if (!locationTokens.length) return false;
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

  const suggestions = useMemo(() => filteredListings, [filteredListings]);

  const activeCenter = useMemo(() => {
    if (searchByCity && resolvedCityCoords) {
      return resolvedCityCoords;
    }
    if (searchByCity && selectedLocation?.latlng?.length === 2) {
      return [selectedLocation.latlng[0], selectedLocation.latlng[1]] as L.LatLngTuple;
    }
    if (selectedLocationSource === 'geolocation' && userLocation) {
      return userLocation;
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
    resolvedCityCoords,
    searchByCity,
    selectedListingId,
    selectedLocation,
    selectedLocationSource,
    userLocation,
  ]);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) ?? null,
    [listings, selectedListingId],
  );

  const selectedCategoryLabel = useMemo(() => {
    if (!selectedListing) return '';
    return (selectedListing.primaryCategory || selectedListing.category?.[0] || '').toString();
  }, [selectedListing]);

  const SelectedCategoryIcon = useMemo(() => {
    if (!selectedCategoryLabel) return null;
    return (categoryIconMap.get(selectedCategoryLabel) ?? null) as IconType | null;
  }, [categoryIconMap, selectedCategoryLabel]);

  const getListingMarkerColor = useCallback(
    (listingId: string) => markerColors[listingId] ?? DEFAULT_MARKER_COLOR,
    [markerColors],
  );

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    setShowResults(false);
    setSelectedListingId(null);
    setHighlightResultsToggle(false);
    void requestDeviceLocation()
      .then((coords) => applyDetectedLocation(coords))
      .finally(() => {
        setIsLocating(false);
      });
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

  const handleFetchMoreListings = useCallback(() => {
    if (loadingListings || !hasMoreListings || !locationQuery) return;
    void fetchListingsPage({ skip: nextSkip, append: true });
  }, [fetchListingsPage, hasMoreListings, loadingListings, locationQuery, nextSkip]);

  const handleToggleResults = useCallback(() => {
    setShowResults((prev) => {
      const next = !prev;
      if (next) {
        setHighlightResultsToggle(false);
      }
      return next;
    });
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
    if (selectedLocationSource !== 'geolocation') return;
    if (!userLocation) return;
    const map = getActiveMap();
    if (map) {
      map.setView(userLocation, CITY_ZOOM, { animate: true });
    }
  }, [getActiveMap, isOpen, selectedLocationSource, userLocation]);

useEffect(() => {
    if (!isOpen) return;
    if (!searchByCity || !selectedLocation) {
      setResolvedCityCoords(null);
      return;
    }

    if (selectedLocationSource === 'geolocation' && selectedLocation.latlng?.length === 2) {
      setResolvedCityCoords([selectedLocation.latlng[0], selectedLocation.latlng[1]]);
      return;
    }

    const selectionKey = [selectedLocation.value, selectedLocation.city, selectedLocation.label]
      .filter(Boolean)
      .join('|');

    const cached = cityCoordsCacheRef.current[selectionKey];
    if (cached) {
      setResolvedCityCoords(cached);
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

    const requestId = ++cityResolveSeqRef.current;
    let cancelled = false;
    const controller = new AbortController();

    const resolveCityCoords = async () => {
      try {
        const featureTypeParam = selectedLocation.city ? '&featuretype=city' : '';
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=en${featureTypeParam}&q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as Array<{ lat: string; lon: string; boundingbox?: [string, string, string, string] }>;
        if (data[0]?.lat && data[0]?.lon) {
          const first = data[0];
          const bbox = first.boundingbox;
          const tuple: L.LatLngTuple =
            bbox && bbox.length === 4
              ? [
                  (parseFloat(bbox[0]) + parseFloat(bbox[1])) / 2,
                  (parseFloat(bbox[2]) + parseFloat(bbox[3])) / 2,
                ]
              : [parseFloat(first.lat), parseFloat(first.lon)];
          if (!cancelled && requestId === cityResolveSeqRef.current) {
            cityCoordsCacheRef.current[selectionKey] = tuple;
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
  }, [isOpen, searchByCity, selectedLocation, selectedLocationSource]);

  useEffect(() => {
    if (!suggestions.length) {
      setHighlightResultsToggle(false);
    }
  }, [suggestions.length]);

  useEffect(() => {
    if (!isOpen) {
      mapRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        embedded
          ? 'relative h-[78vh] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white'
          : 'fixed inset-0 z-50 bg-white',
        className,
      )}
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
          <MapZoomWatcher onZoomChange={setMapZoom} />
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
            return (
              <Marker
                key={listing.id}
                position={coords}
                icon={buildCategoryIcon(
                  resolveListingCategoryIcon(listing),
                  getListingMarkerColor(listing.id),
                  markerSize,
                )}
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

      {!embedded && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 bottom-10 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg"
          aria-label="Close map"
        >
          <IoClose size={18} />
        </button>
      )}

      {selectedListing && (
        <div className="absolute bottom-6 left-1/2 z-20 w-[92vw] max-w-xl -translate-x-1/2">
          <div className="rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  {selectedCategoryLabel && (
                    <span className="inline-flex w-fit items-center gap-1 text-nowrap rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 shadow-sm">
                      {SelectedCategoryIcon && <SelectedCategoryIcon className="h-3 w-3" aria-hidden />}
                      <span>{selectedCategoryLabel}</span>
                    </span>
                  )}
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col items-start gap-2">
              {/* <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Search mode
              </div> */}
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={isLocating}
                className="hidden items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 transition hover:border-neutral-300 disabled:opacity-60 sm:inline-flex"
                aria-label="Use current location"
              >
                <LuLocateFixed className="text-neutral-700" />
                {isLocating ? 'Locating…' : 'Use my location'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={isLocating}
                className="inline-flex py-2 items-center justify-center gap-1 rounded-xl border border-neutral-200 bg-white px-3 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 transition hover:border-neutral-300 disabled:opacity-60 sm:hidden"
                aria-label="Use current location"
              >
                <LuLocateFixed size={14} className="text-neutral-700" />
                <span>{isLocating ? '...' : 'My Location'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchByCity((prev) => {
                    const next = !prev;
                    setShowResults(false);
                    return next;
                  });
                  setSearchQuery('');
                  setHighlightResultsToggle(false);
                }}
                className={clsx(
                  'relative flex items-center gap-3 rounded-xl border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition',
                  searchByCity ? 'border-blue-200 bg-white text-blue-700' : 'border-neutral-200 bg-white text-blue-700',
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
                    className="flex w-full items-start gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <CountrySearchSelect
                        value={selectedLocation}
                        onChange={(value) => {
                          locationResolveSeqRef.current += 1;
                          cityResolveSeqRef.current += 1;
                          setSelectedLocation(value ?? null);
                          setSelectedLocationSource(value ? 'manual' : null);
                          setSearchQuery('');
                          setShowResults(false);
                          setHighlightResultsToggle(false);
                          setResolvedCityCoords(null);
                          if (!value) {
                            setListings([]);
                            setHasMoreListings(false);
                            setNextSkip(0);
                            setSelectedListingId(null);
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleResults}
                        className={clsx(
                          'flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-white shadow-md transition-transform duration-300',
                          !showResults && highlightResultsToggle && suggestions.length > 0 && 'animate-pulse ring-2 ring-blue-400 ring-offset-1',
                        )}
                        aria-label={showResults ? 'Hide results' : 'Show results'}
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
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="service-search"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="flex w-full items-center gap-2"
                  >
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by title, category, or keyword"
                      className="w-full flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 shadow-sm focus:border-neutral-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleToggleResults}
                      className={clsx(
                        'inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 shadow-sm transition',
                        !showResults && highlightResultsToggle && suggestions.length > 0 && 'animate-pulse ring-2 ring-blue-400 ring-offset-1',
                      )}
                      aria-label={showResults ? 'Hide results' : 'Show results'}
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
                      ) : suggestions.length === 0 && searchByCity ? (
                        <div className="px-4 py-3 text-xs text-neutral-500">
                          {selectedLocation
                            ? 'No listings found for this location yet.'
                            : 'Select a country or city to fetch listings.'}
                        </div>
                      ) : (
                        <>
                          {suggestions.map((listing) => {
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
                          })}
                          {searchByCity && selectedLocation && (
                            <div className="sticky bottom-0 z-10 border-t border-neutral-100 bg-white px-3 py-2">
                              <button
                                type="button"
                                onClick={handleFetchMoreListings}
                                disabled={!hasMoreListings || loadingListings}
                                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {loadingListings
                                  ? 'Fetching…'
                                  : hasMoreListings
                                    ? `Fetch more (${PAGE_SIZE})`
                                    : 'No more listings'}
                              </button>
                            </div>
                          )}
                        </>
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
