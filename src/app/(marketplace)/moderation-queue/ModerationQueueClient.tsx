'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { formatPuntiPercentage } from '@/app/(marketplace)/constants/partner';
import type { PricingTier } from '@/app/(marketplace)/libs/pricing';
import { getDisplayPricing } from '@/app/(marketplace)/libs/pricingDisplay';
import type { ListingLike } from '@/app/(marketplace)/libs/pricingDisplay';

const SearchMap = dynamic(() => import('../components/SearchMap'), { ssr: false });

type Attachment = { name?: string; data?: string; url?: string };

interface Listing {
  id: string;
  title: string;
  description?: string | null;
  status: 'pending' | 'revision' | 'awaiting_reapproval' | string;
  guestCount: number;
  price?: number | null;
  pricingType?: 'fixed' | 'group' | 'custom' | string | null;
  groupPrice?: number | null;
  groupSize?: number | null;
  customPricing?: PricingTier[] | null;
  experienceHour?: number | string | null;
  imageSrc: string[];
  category?: string[] | null;
  primaryCategory?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user: {
    name: string;
    email: string;
  };
  location?: {
    label?: string;
    city?: string;
    country?: string;
  } | null;
  locationValue?: string | null;
  punti?: number;
  puntiShare?: number;
  hoursInAdvance?: number | null;
  languages?: string[] | null;
  locationType?: string[] | null;
  meetingPoint?: string | null;
  hostDescription?: string | null;
  locationDescription?: string | null;
  moderationNoteText?: string | null;
  moderationNoteAttachments?: Attachment[] | null;
}

const statusMeta: Record<
  Listing['status'],
  { badge: string; label: string; dot: string; description: string }
> = {
  pending: {
    badge: 'bg-amber-100 text-amber-800 ring-amber-200',
    label: 'Awaiting review',
    dot: 'bg-amber-400',
    description: 'New submission waiting for moderation.',
  },
  revision: {
    badge: 'bg-blue-100 text-blue-800 ring-blue-200',
    label: 'Needs revision review',
    dot: 'bg-blue-500',
    description: 'Host resubmitted changes for verification.',
  },
  awaiting_reapproval: {
    badge: 'bg-purple-100 text-purple-800 ring-purple-200',
    label: 'Reactivation request',
    dot: 'bg-purple-500',
    description: 'Listing was reactivated and needs approval to go live.',
  },
};

const titleCase = (value: string) =>
  value
    .split(' ')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : ''))
    .join(' ');

const parseLocationValue = (value?: string | null) => {
  if (!value) return { city: null as string | null, countryCode: null as string | null };
  const cleaned = value.replace(/_/g, '-');
  const segments = cleaned.split('-').filter(Boolean);
  if (segments.length === 0) return { city: null, countryCode: null };
  const countryCode = segments.pop() ?? '';
  const city = segments.join(' ');
  return {
    city: city ? titleCase(city.replace(/\s+/g, ' ')) : null,
    countryCode: countryCode ? countryCode.toUpperCase() : null,
  };
};

const formatLocationTypes = (types?: string[] | null) => {
  if (!Array.isArray(types) || types.length === 0) return 'Not provided';
  return types
    .map((type) => titleCase(type.replace(/_/g, ' ')))
    .join(', ');
};

const formatHoursInAdvance = (value?: number | null) => {
  if (typeof value !== 'number') return 'No notice set';
  if (value <= 0) return 'Same-day bookings allowed';
  if (value < 24) return `${value} hours notice`;
  const days = Math.floor(value / 24);
  const remainingHours = value % 24;
  if (remainingHours === 0) return `${days} day${days === 1 ? '' : 's'} notice`;
  return `${days} day${days === 1 ? '' : 's'} + ${remainingHours}h notice`;
};

const MediaSlider = ({
  media,
  title,
  onOpen,
}: {
  media: string[];
  title: string;
  onOpen?: (slides: string[], startIndex: number) => void;
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [media]);

  if (media.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-500">No media</div>
    );
  }

  const prev = () => setIndex((value) => (value - 1 + media.length) % media.length);
  const next = () => setIndex((value) => (value + 1) % media.length);

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-100">
      <div className="relative h-64 w-full overflow-hidden">
        <Image
          key={media[index]}
          src={media[index]}
          alt={title}
          fill
          className="cursor-zoom-in object-cover transition duration-500 ease-in-out"
          sizes="(min-width: 1024px) 480px, (min-width: 768px) 50vw, 100vw"
          unoptimized
          onClick={() => onOpen?.(media, index)}
        />
      </div>
      {media.length > 1 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
          <button
            type="button"
            onClick={prev}
            className="pointer-events-auto rounded-full bg-white/90 p-2 text-neutral-800 shadow-md transition hover:-translate-x-0.5 hover:bg-white"
            aria-label="Previous image"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            className="pointer-events-auto rounded-full bg-white/90 p-2 text-neutral-800 shadow-md transition hover:translate-x-0.5 hover:bg-white"
            aria-label="Next image"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      )}
      {media.length > 1 && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
          {media.map((item, dotIndex) => (
            <span
              key={item + dotIndex}
              className={clsx(
                'h-2 w-2 rounded-full bg-white/60 transition',
                dotIndex === index ? 'scale-110 bg-white shadow' : 'opacity-70',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ModerationQueueClient = () => {
  const router = useRouter();
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [revisionListings, setRevisionListings] = useState<Listing[]>([]);
  const [awaitingReapprovalListings, setAwaitingReapprovalListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'revision' | 'awaiting_reapproval'>('pending');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSlides, setLightboxSlides] = useState<{ src: string }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [rejectionNotes, setRejectionNotes] = useState<
    Record<string, { note: string; attachments: Attachment[] }>
  >({});

  const regionNames = useMemo(() => new Intl.DisplayNames(['en'], { type: 'region' }), []);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/listings/pending');
      setPendingListings(Array.isArray(res.data?.pending) ? res.data.pending : []);
      setRevisionListings(Array.isArray(res.data?.revision) ? res.data.revision : []);
      setAwaitingReapprovalListings(
        Array.isArray(res.data?.awaitingReapproval) ? res.data.awaitingReapproval : [],
      );
    } catch (error) {
      console.error('[MODERATION_QUEUE_FETCH]', error);
      toast.error("Couldn't load moderation queue.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const allListings = useMemo(
    () => [...pendingListings, ...revisionListings, ...awaitingReapprovalListings],
    [awaitingReapprovalListings, pendingListings, revisionListings],
  );

  const getLocationParts = useCallback(
    (listing: Listing) => {
      const parsed = parseLocationValue(listing.locationValue);
      const city = listing.location?.city || parsed.city;
      const countryCode = (listing.location?.country || parsed.countryCode)?.toUpperCase() ?? null;
      const countryName = countryCode ? regionNames.of(countryCode) || countryCode : listing.location?.country || null;
      const normalizedCode = countryCode && countryCode.length <= 3 ? countryCode.toLowerCase() : null;

      return {
        city: city || null,
        countryCode: normalizedCode,
        countryName: countryName || null,
      };
    },
    [regionNames],
  );

  const formatLocation = useCallback(
    (listing: Listing) => {
      if (listing.location?.label) return listing.location.label;
      const { city, countryName, countryCode } = getLocationParts(listing);
      if (city && (countryName || countryCode)) return `${city}, ${countryName ?? countryCode}`;
      if (city) return city;
      if (listing.locationValue) return listing.locationValue;
      return 'Location not provided';
    },
    [getLocationParts],
  );

  useEffect(() => {
    const locations = new Set<string>();
    const categories = new Set<string>();

    allListings.forEach((listing) => {
      const loc = formatLocation(listing);
      if (loc) locations.add(loc);

      if (listing.primaryCategory) {
        categories.add(listing.primaryCategory);
      }
      if (Array.isArray(listing.category)) {
        listing.category.forEach((cat) => categories.add(cat));
      }
    });

    setAllLocations(Array.from(locations));
    setAllCategories(Array.from(categories));
  }, [allListings, formatLocation]);

  const formatPrice = useCallback((listing: Listing) => {
    const { pricingType, price, groupPrice, groupSize, customPricing } = listing;

    // Custom pricing tiers
    if (pricingType === 'custom') {
      const tiers = Array.isArray(customPricing)
        ? customPricing.filter((tier): tier is PricingTier => !!tier && typeof tier.price === 'number')
        : [];

      if (tiers.length === 0) return 'Custom pricing';

      const minPrice = tiers.reduce(
        (min, tier) => (tier.price < min ? tier.price : min),
        tiers[0].price,
      );

      return `Custom from ${minPrice}`;
    }

    // Group pricing
    if (pricingType === 'group') {
      if (typeof groupPrice === 'number' && groupPrice > 0) {
        const sizeLabel =
          typeof groupSize === 'number' && groupSize > 0 ? `${groupSize} people` : 'group';
        return `${groupPrice} for ${sizeLabel}`;
      }
      return 'Group pricing';
    }

    // Fixed / default pricing
    if (typeof price === 'number' && price > 0) {
      return `${price} per guest`;
    }

    return 'Pricing not set';
  }, []);

  const filteredListings = useMemo(() => {
    const listingsByStatus = (() => {
      switch (statusFilter) {
        case 'revision':
          return revisionListings;
        case 'awaiting_reapproval':
          return awaitingReapprovalListings;
        case 'pending':
        default:
          return pendingListings;
      }
    })();

    return listingsByStatus.filter((listing) => {
      const locationMatches = locationFilter ? formatLocation(listing) === locationFilter : true;

      const categoryMatches = categoryFilter
        ? listing.primaryCategory === categoryFilter || listing.category?.includes(categoryFilter)
        : true;

      return locationMatches && categoryMatches;
    });
  }, [awaitingReapprovalListings, categoryFilter, formatLocation, locationFilter, pendingListings, revisionListings, statusFilter]);

  const updateRejectionNote = useCallback((listingId: string, note: string) => {
    setRejectionNotes((prev) => ({
      ...prev,
      [listingId]: {
        note,
        attachments: prev[listingId]?.attachments ?? [],
      },
    }));
  }, []);

  const handleAttachmentUpload = useCallback((listingId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selected = Array.from(files).slice(0, 4);

    Promise.all(
      selected.map(
        (file) =>
          new Promise<Attachment>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                data: typeof reader.result === 'string' ? reader.result : undefined,
              });
            };
            reader.onerror = () => resolve({ name: file.name });
            reader.readAsDataURL(file);
          }),
      ),
    ).then((uploaded) => {
      setRejectionNotes((prev) => {
        const existing = prev[listingId]?.attachments ?? [];
        const next = [...existing, ...uploaded].slice(0, 4);
        return {
          ...prev,
          [listingId]: {
            note: prev[listingId]?.note ?? '',
            attachments: next,
          },
        };
      });
    });
  }, []);

  const removeAttachment = useCallback((listingId: string, index: number) => {
    setRejectionNotes((prev) => {
      const existing = prev[listingId];
      if (!existing) return prev;
      const next = existing.attachments.filter((_, attachmentIndex) => attachmentIndex !== index);
      return {
        ...prev,
        [listingId]: { note: existing.note, attachments: next },
      };
    });
  }, []);

  const openLightbox = useCallback((slides: string[], startIndex: number) => {
    if (!Array.isArray(slides) || slides.length === 0) return;

    setLightboxSlides(slides.map((src) => ({ src })));
    setLightboxIndex(Math.max(0, Math.min(startIndex, slides.length - 1)));
    setLightboxOpen(true);
  }, []);

  const closeLightbox = () => setLightboxOpen(false);

  const handleAction = useCallback(
    async (listingId: string, action: 'approve' | 'reject') => {
      setActionLoading(`${action}-${listingId}`);
      try {
        const rejectionState = rejectionNotes[listingId];
        const payload =
          action === 'reject'
            ? {
                note: rejectionState?.note?.trim() || undefined,
                attachments:
                  rejectionState?.attachments?.map((attachment) => ({
                    name: attachment.name,
                    data: attachment.data,
                    url: attachment.url,
                  })) || [],
              }
            : undefined;

        await axios.post(`/api/listings/${listingId}/${action}`, payload);
        toast.success(`Listing ${action === 'approve' ? 'approved' : 'rejected'}.`);
        fetchListings();
        if (action === 'reject') {
          setRejectionNotes((prev) => ({
            ...prev,
            [listingId]: { note: '', attachments: [] },
          }));
        }
      } catch (error: any) {
        console.error(`[MODERATION_QUEUE_${action.toUpperCase()}]`, error);
        toast.error(error?.response?.data || `Failed to ${action} listing.`);
      } finally {
        setActionLoading(null);
      }
    },
    [fetchListings, rejectionNotes],
  );

  const renderCard = (listing: Listing) => {
    const meta = statusMeta[listing.status] ?? {
      badge: 'bg-neutral-100 text-neutral-800 ring-neutral-200',
      label: listing.status,
      dot: 'bg-neutral-400',
      description: 'Awaiting action',
    };

    const createdDate = listing.createdAt ? format(new Date(listing.createdAt), 'PPP') : 'Unknown date';
    const experienceLabel = listing.experienceHour
      ? `${listing.experienceHour} hour${Number(listing.experienceHour) === 1 ? '' : 's'}`
      : 'Duration not set';

    const media = Array.isArray(listing.imageSrc)
      ? listing.imageSrc.filter((src): src is string => typeof src === 'string' && src.trim().length > 0)
      : [];
    const imageSlides = media.filter((src) => !/\.(mp4|webm|mov)$/i.test(src));

    const punti = typeof listing.punti === 'number' ? listing.punti : null;
    const puntiShare = typeof listing.puntiShare === 'number' ? listing.puntiShare : null;

    const languages = Array.isArray(listing.languages)
      ? listing.languages.join(', ')
      : Array.isArray((listing as any).languages)
        ? (listing as any).languages.join(', ')
        : 'Not provided';
    const locationTypes = formatLocationTypes(listing.locationType ?? (listing as any).locationType);
    const meetingPoint = listing.meetingPoint || (listing as any).meetingPoint || 'Not provided';
    const hostNotes = listing.hostDescription || (listing as any).hostDescription || 'Not provided';
    const locationDescription =
      listing.locationDescription || (listing as any).locationDescription || 'Not provided';
    const locationValue = formatLocation(listing);
    const priceSummary = formatPrice(listing);
    const hoursNotice = formatHoursInAdvance(listing.hoursInAdvance ?? (listing as any).hoursInAdvance);
    const locationParts = getLocationParts(listing);
    const rejectionState = rejectionNotes[listing.id] ?? { note: '', attachments: [] };

    return (
      <article
        key={listing.id}
        className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-neutral-200/70 transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div className="relative h-64 w-full overflow-hidden bg-neutral-100">
          <MediaSlider
            media={media}
            title={listing.title}
            onOpen={(slides, slideIndex) => openLightbox(imageSlides.length ? imageSlides : slides, slideIndex)}
          />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span
              className={clsx(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-2 ring-offset-2 ring-offset-white',
                meta.badge,
              )}
            >
              <span className={clsx('h-2 w-2 rounded-full', meta.dot)} />
              {meta.label}
            </span>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-800 shadow">
              {createdDate}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white shadow">
            Host: {listing.user.name}
          </div>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-neutral-900">{listing.title}</h2>
              <p className="text-sm text-neutral-600">{meta.description}</p>
            </div>
            <div className="text-right text-sm font-semibold text-neutral-800">
              <p>{priceSummary}</p>
              <p className="text-xs text-neutral-500">{experienceLabel}</p>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
            <div className="rounded-xl bg-neutral-50 px-3 py-2 transition duration-300 ease-out">
              <p className="text-xs uppercase text-neutral-500">Location</p>
              <div className="flex items-center gap-2 font-semibold text-neutral-900">
                {locationParts.countryCode && (
                  <Image
                    src={`/flags/${locationParts.countryCode}.svg`}
                    alt={locationParts.countryName ?? locationParts.countryCode}
                    width={20}
                    height={14}
                    className="rounded-sm border border-neutral-200"
                  />
                )}
                <span>{locationValue}</span>
              </div>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-2 transition duration-300 ease-out">
              <p className="text-xs uppercase text-neutral-500">Guest capacity</p>
              <p className="font-semibold text-neutral-900">{listing.guestCount} guests</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-2 transition duration-300 ease-out">
              <p className="text-xs uppercase text-neutral-500">Host</p>
              <p className="font-semibold text-neutral-900">{listing.user.name}</p>
              <p className="text-xs text-neutral-500">{listing.user.email}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-2 transition duration-300 ease-out">
              <p className="text-xs uppercase text-neutral-500">Categories</p>
              <p className="font-semibold text-neutral-900">
                {listing.primaryCategory || listing.category?.join(', ') || 'Not provided'}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-2 transition duration-300 ease-out">
              <p className="text-xs uppercase text-neutral-500">Pricing</p>
              <p className="font-semibold text-neutral-900">{priceSummary}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-2 transition duration-300 ease-out">
              <p className="text-xs uppercase text-neutral-500">Experience length</p>
              <p className="font-semibold text-neutral-900">{experienceLabel}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-2 transition duration-300 ease-out">
              <p className="text-xs uppercase text-neutral-500">Hours in advance</p>
              <p className="font-semibold text-neutral-900">{hoursNotice}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-2 transition duration-300 ease-out">
              <p className="text-xs uppercase text-neutral-500">Languages</p>
              <p className="font-semibold text-neutral-900">{languages}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-2 transition duration-300 ease-out">
              <p className="text-xs uppercase text-neutral-500">Location types</p>
              <p className="font-semibold text-neutral-900">{locationTypes}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-2 transition duration-300 ease-out">
              <p className="text-xs uppercase text-neutral-500">Punti</p>
              <p className="font-semibold text-neutral-900">
                {punti !== null ? punti : '—'}
                {typeof puntiShare === 'number' && ` • ${formatPuntiPercentage(puntiShare)} share`}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-2 transition duration-300 ease-out">
              <p className="text-xs uppercase text-neutral-500">Listing ID</p>
              <p className="font-semibold text-neutral-900 break-all">{listing.id}</p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Overview</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-800">{listing.description || 'No description provided yet.'}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 rounded-xl bg-white p-3 shadow-sm ring-1 ring-neutral-100">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Meeting point</p>
                <p className="text-sm text-neutral-800">{meetingPoint}</p>
                {(locationParts.city || locationParts.countryName || locationParts.countryCode) && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                    <div className="h-48">
                        <SearchMap
                            key={`map-${listing.id}-${locationParts.city ?? locationParts.countryName ?? locationParts.countryCode ?? 'default'}`}
                            city={locationParts.city ?? undefined}
                            country={locationParts.countryName ?? locationParts.countryCode ?? undefined}
                            center={[41.9028, 12.4964] as [number, number]}
                        />
                        </div>
                    <div className="flex items-center justify-between px-3 py-2 text-xs text-neutral-600">
                      <span className="font-semibold text-neutral-800">Map preview</span>
                      <span>
                        {locationParts.city}
                        {locationParts.city && (locationParts.countryName || locationParts.countryCode) ? ', ' : ''}
                        {locationParts.countryName || locationParts.countryCode || ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-1 rounded-xl bg-white p-3 shadow-sm ring-1 ring-neutral-100">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Host notes</p>
                <p className="whitespace-pre-line text-sm text-neutral-800">{hostNotes}</p>
              </div>
              <div className="space-y-1 rounded-xl bg-white p-3 shadow-sm ring-1 ring-neutral-100 md:col-span-2">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Location description</p>
                    <p className="text-sm text-neutral-800">{locationValue}</p>
                  </div>
                  <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                    Revision submitted
                  </span>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-800">{locationDescription}</p>
                <div className="rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                  Revision updates
                  <p className="text-neutral-500">
                    The host has resubmitted updates for this experience. Compare the latest details before approving the changes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">Rejection note</p>
                <p className="text-sm text-neutral-700">Add guidance for the host before rejecting. You can attach up to four files.</p>
              </div>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">Visible to host</span>
            </div>

            <textarea
              value={rejectionState.note}
              onChange={(event) => updateRejectionNote(listing.id, event.target.value)}
              placeholder="Explain why this listing is rejected and how it could be improved."
              className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
              rows={3}
            />

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-800 shadow-sm ring-1 ring-neutral-200 transition hover:ring-neutral-300">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(event) => handleAttachmentUpload(listing.id, event.target.files)}
                />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 1 1 4.24 4.24l-9.2 9.19a1 1 0 0 1-1.41-1.41l8.49-8.48" />
                </svg>
                Attach files
              </label>

              {rejectionState.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {rejectionState.attachments.map((attachment, index) => (
                    <span
                      key={`${listing.id}-attachment-${index}`}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-neutral-500">
                        <path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 1 1 4.24 4.24l-9.2 9.19a1 1 0 0 1-1.41-1.41l8.49-8.48" />
                      </svg>
                      <span className="max-w-[180px] truncate">{attachment.name || 'Attachment'}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(listing.id, index)}
                        className="rounded-full bg-neutral-100 p-1 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-800"
                        aria-label="Remove attachment"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-neutral-500">
              Last updated {listing.updatedAt ? format(new Date(listing.updatedAt), 'PPpp') : 'Unknown'}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAction(listing.id, 'reject')}
                disabled={actionLoading !== null}
                className="rounded-full border border-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === `reject-${listing.id}` ? 'Rejecting…' : 'Reject'}
              </button>
              <button
                type="button"
                onClick={() => handleAction(listing.id, 'approve')}
                disabled={actionLoading !== null}
                className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === `approve-${listing.id}` ? 'Approving…' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-10 lg:px-16">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Moderation</p>
          <h1 className="text-3xl font-semibold text-neutral-900">Moderation queue</h1>
          <p className="text-sm text-neutral-600">Review submissions, revisions, and reactivation requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/moderation')}
            className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-500 hover:text-neutral-900"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to tools
          </button>
          <button
            type="button"
            onClick={fetchListings}
            disabled={isLoading}
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          aria-pressed={statusFilter === 'pending'}
          className={clsx(
            'rounded-2xl bg-white px-4 py-3 text-left shadow ring-1 ring-neutral-200 transition hover:-translate-y-0.5 hover:shadow-md',
            statusFilter === 'pending' && 'ring-2 ring-neutral-900',
          )}
        >
          <p className="text-xs uppercase text-neutral-500">New</p>
          <p className="text-2xl font-semibold text-neutral-900">{pendingListings.length}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('revision')}
          aria-pressed={statusFilter === 'revision'}
          className={clsx(
            'rounded-2xl bg-white px-4 py-3 text-left shadow ring-1 ring-neutral-200 transition hover:-translate-y-0.5 hover:shadow-md',
            statusFilter === 'revision' && 'ring-2 ring-neutral-900',
          )}
        >
          <p className="text-xs uppercase text-neutral-500">Revision</p>
          <p className="text-2xl font-semibold text-neutral-900">{revisionListings.length}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('awaiting_reapproval')}
          aria-pressed={statusFilter === 'awaiting_reapproval'}
          className={clsx(
            'rounded-2xl bg-white px-4 py-3 text-left shadow ring-1 ring-neutral-200 transition hover:-translate-y-0.5 hover:shadow-md',
            statusFilter === 'awaiting_reapproval' && 'ring-2 ring-neutral-900',
          )}
        >
          <p className="text-xs uppercase text-neutral-500">Re-approval</p>
          <p className="text-2xl font-semibold text-neutral-900">{awaitingReapprovalListings.length}</p>
        </button>
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl bg-white p-4 shadow ring-1 ring-neutral-200 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Location</label>
          <select
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
          >
            <option value="">All locations</option>
            {allLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Category</label>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
          >
            <option value="">All categories</option>
            {allCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700 ring-1 ring-neutral-200">
          <p className="flex items-center gap-2 font-semibold text-neutral-900">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-neutral-900" />
            {statusMeta[statusFilter]?.label ?? 'Queue'}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-white px-3 py-1 font-semibold text-neutral-800 ring-1 ring-neutral-200">
              Status: {statusMeta[statusFilter]?.label ?? statusFilter}
            </span>
            <span className="rounded-full bg-white px-3 py-1 font-semibold text-neutral-800 ring-1 ring-neutral-200">
              Location: {locationFilter || 'All locations'}
            </span>
            <span className="rounded-full bg-white px-3 py-1 font-semibold text-neutral-800 ring-1 ring-neutral-200">
              Category: {categoryFilter || 'All categories'}
            </span>
          </div>
        </div>
        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-neutral-200 bg-white/70 p-10 text-center text-sm text-neutral-500">
            Loading moderation queue…
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200 bg-white/70 p-10 text-center text-sm text-neutral-500">
            Nothing to review right now.
          </div>
        ) : (
          filteredListings.map(renderCard)
        )}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={closeLightbox}
        slides={lightboxSlides}
        index={lightboxIndex}
        animation={{ fade: 350 }}
        carousel={{ finite: false }}
        on={{
          view: ({ index }) => setLightboxIndex(index),
        }}
      />
    </div>
  );
};

export default ModerationQueueClient;