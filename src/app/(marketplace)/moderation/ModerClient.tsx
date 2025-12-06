'use client';

import { useCallback, useEffect, useMemo, useState, ChangeEvent } from 'react';
import Image from 'next/image';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { SafeUser } from '@/app/(marketplace)/types';
import { useRouter } from 'next/navigation';
import PlatformCard from '../components/PlatformCard';
import ConfirmPopup from '../components/ConfirmPopup';
import useCurrencyFormatter from '@/app/(marketplace)/hooks/useCurrencyFormatter';
import Slider from 'react-slick';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import clsx from 'clsx';
import { PricingTier } from '@/app/(marketplace)/libs/pricing';
import { getDisplayPricing } from '@/app/(marketplace)/libs/pricingDisplay';
import type { ListingLike } from '@/app/(marketplace)/libs/pricingDisplay';
import {
  MAX_PARTNER_COMMISSION,
  MAX_PARTNER_POINT_VALUE,
  MIN_PARTNER_COMMISSION,
  computePartnerCommission,
  formatPuntiPercentage,
  getPuntiLabel,
} from "@/app/(marketplace)/constants/partner";
import { BASE_CURRENCY } from '@/app/(marketplace)/constants/locale';
import { categories as NAV_CATEGORIES } from '../components/navbar/Categories';
import { MAX_PINNED_CATEGORIES, PINNED_CATEGORIES_STORAGE_KEY } from '../constants/categoryPreferences';

type SliderArrowProps = {
  className?: string;
  onClick?: () => void;
  direction: 'next' | 'prev';
};

const SliderArrow = ({ className, onClick, direction }: SliderArrowProps) => {
  const isDisabled = className?.includes('slick-disabled');

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'next' ? 'Next slide' : 'Previous slide'}
      disabled={isDisabled}
      className={clsx(
        'absolute top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-neutral-800 shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-black/10',
        direction === 'next' ? 'right-4' : 'left-4',
        isDisabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {direction === 'next' ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
      </svg>
      <span className="sr-only">{direction === 'next' ? 'Next slide' : 'Previous slide'}</span>
    </button>
  );
};

const MEDIA_SLIDER_SETTINGS = {
  dots: true,
  infinite: false,
  speed: 450,
  slidesToShow: 1,
  slidesToScroll: 1,
  arrows: true,
  adaptiveHeight: true,
  autoplay: false,
  nextArrow: <SliderArrow direction="next" />,
  prevArrow: <SliderArrow direction="prev" />,
};

const DETAIL_SLIDER_SETTINGS = {
  dots: true,
  infinite: false,
  speed: 400,
  slidesToShow: 1,
  slidesToScroll: 1,
  arrows: true,
  adaptiveHeight: true,
  autoplay: false,
  nextArrow: <SliderArrow direction="next" />,
  prevArrow: <SliderArrow direction="prev" />,
};

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatJson = (value: any) => JSON.stringify(value, null, 2);

const readPinnedCategoriesFromStorage = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(PINNED_CATEGORIES_STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => (typeof value === 'string' ? value : null))
      .filter((value): value is string => Boolean(value))
      .slice(0, MAX_PINNED_CATEGORIES);
  } catch {
    return [];
  }
};

interface Listing {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'revision' | 'awaiting_reapproval' | string;
  guestCount: number;
  price?: number | null;
  pricingType?: 'fixed' | 'group' | 'custom' | string | null;
  groupPrice?: number | null;
  groupSize?: number | null;
  customPricing?: PricingTier[] | null;
  experienceHour?: number | string;
  hostDescription?: string | null;
  meetingPoint?: string | null;
  languages?: string[];
  locationType?: string[];
  locationDescription?: string | null;
  locationValue?: string | null;
  location?: {
    label?: string;
    city?: string;
    country?: string;
    value?: string;
  } | null;
  imageSrc: string[];
  category?: string[] | null;
  primaryCategory?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user: {
    name: string;
    email: string;
  };
}

interface ModerationClientProps {
  currentUser: SafeUser | null;
}

type DataEntry = {
  date: string;
  revenue: number;
  platformFee: number;
  bookingCount: number;
};

const ModerationClient: React.FC<ModerationClientProps> = ({ currentUser }) => {
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [revisionListings, setRevisionListings] = useState<Listing[]>([]);
  const [awaitingReapprovalListings, setAwaitingReapprovalListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [platformData, setPlatformData] = useState<{
    daily: DataEntry[];
    monthly: DataEntry[];
    yearly: DataEntry[];
    totalRevenue: number;
    partnerCommission: number;
    punti: number;
    puntiShare: number;
    puntiLabel: string;
    
  }>({
    daily: [],
    monthly: [],
    yearly: [],
    totalRevenue: 0,
    partnerCommission: MIN_PARTNER_COMMISSION,
    punti: 0,
    puntiShare: 0,
    puntiLabel: 'No punti yet',
  });
    
  const router = useRouter();

  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [cancellationNote, setCancellationNote] = useState('');
  const [cancellationAttachment, setCancellationAttachment] = useState<{ name: string; data: string } | null>(null);
  const [hostLookup, setHostLookup] = useState('');

  const [reservationLookupId, setReservationLookupId] = useState('');
  const [reservationLookupUsername, setReservationLookupUsername] = useState('');
  const [reservationDetails, setReservationDetails] = useState<any[]>([]);
  const [listingLookupId, setListingLookupId] = useState('');
  const [listingLookupUsername, setListingLookupUsername] = useState('');
  const [listingDetails, setListingDetails] = useState<any[]>([]);
  const [userLookup, setUserLookup] = useState('');
  const [userRecord, setUserRecord] = useState<any>(null);

  const [promoterLookup, setPromoterLookup] = useState('');
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [promoterAnalytics, setPromoterAnalytics] = useState<any>(null);
  const { formatConverted } = useCurrencyFormatter();

  const [hostUserId, setHostUserId] = useState('');
  const [promoterUserId, setPromoterUserId] = useState('');
  const [pinnedCategories, setPinnedCategories] = useState<string[]>([]);

  const [hostPayoutAmount, setHostPayoutAmount] = useState('');
  const [promoterPayoutAmount, setPromoterPayoutAmount] = useState('');
  const [promoterPayoutNote, setPromoterPayoutNote] = useState('');
  const [hostPayoutNote, setHostPayoutNote] = useState('');
  const [promoterAttachment, setPromoterAttachment] = useState<{ name: string; data: string } | null>(null);
  const [hostAttachment, setHostAttachment] = useState<{ name: string; data: string } | null>(null);

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const [showHostWithdrawConfirm, setShowHostWithdrawConfirm] = useState(false);
  const [showPromoterWithdrawConfirm, setShowPromoterWithdrawConfirm] = useState(false);

  const [showHostPayoutConfirm, setShowHostPayoutConfirm] = useState(false);
  const [showPromoterPayoutConfirm, setShowPromoterPayoutConfirm] = useState(false);

  type ModerationStatusKey = 'pending' | 'revision' | 'awaiting_reapproval';

  const [statusFilter, setStatusFilter] = useState<ModerationStatusKey>('pending');
  const [filters, setFilters] = useState<{ location: string; category: string }>({
    location: '',
    category: '',
  });
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [isFetchingListings, setIsFetchingListings] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSlides, setLightboxSlides] = useState<{ src: string }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [moderListingId, setModerListingId] = useState('');
  const [moderSuspendUserId, setModerSuspendUserId] = useState('');
  const [isDeactivatingListing, setIsDeactivatingListing] = useState(false);
  const [isSuspendingUser, setIsSuspendingUser] = useState(false);
  const [showListingDeactivateConfirm, setShowListingDeactivateConfirm] = useState(false);
  const [showSuspendConfirmPopup, setShowSuspendConfirmPopup] = useState(false);
  const [puntiUpdate, setPuntiUpdate] = useState({ listingId: '', punti: '' });
  const [isUpdatingPunti, setIsUpdatingPunti] = useState(false);

  const [puntiResult, setPuntiResult] = useState<{ added: number; total: number } | null>(null);
  const [currentListingPunti, setCurrentListingPunti] = useState<number | null>(null);
  const [isFetchingReservation, setIsFetchingReservation] = useState(false);
  const [isFetchingListing, setIsFetchingListing] = useState(false);

  const openLightbox = (slides: string[], startIndex: number) => {
    if (!Array.isArray(slides) || slides.length === 0) return;

    setLightboxSlides(slides.map((src) => ({ src })));
    setLightboxIndex(Math.max(0, Math.min(startIndex, slides.length - 1)));
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const fetchListings = useCallback(
    async (criteria: { location?: string; category?: string } = {}) => {
      setIsFetchingListings(true);

      try {
        const params: Record<string, string> = {};
        if (criteria.location) {
          params.location = criteria.location;
        }
        if (criteria.category) {
          params.category = criteria.category;
        }

        const res = await axios.get('/api/listings/pending', {
          params,
        });

        const pending = Array.isArray(res.data?.pending) ? res.data.pending : [];
        const revision = Array.isArray(res.data?.revision) ? res.data.revision : [];
        const awaitingReapproval = Array.isArray(res.data?.awaitingReapproval)
          ? res.data.awaitingReapproval
          : [];

        setPendingListings(pending);
        setRevisionListings(revision);
        setAwaitingReapprovalListings(awaitingReapproval);

        const collectLocations = (listings: Listing[]) =>
          listings
            .map((listing) => {
              if (typeof listing.locationValue === 'string' && listing.locationValue.trim()) {
                return listing.locationValue.trim();
              }
              if (listing.location && typeof listing.location?.value === 'string') {
                return listing.location.value.trim();
              }
              return null;
            })
            .filter((value): value is string => Boolean(value));

        const collectCategories = (listings: Listing[]) =>
          listings
            .flatMap((listing) => {
              const categories: string[] = [];
              if (Array.isArray(listing.category)) {
                categories.push(...listing.category.filter((value): value is string => typeof value === 'string'));
              }
              if (typeof listing.primaryCategory === 'string') {
                categories.push(listing.primaryCategory);
              }
              return categories;
            })
            .filter((value) => typeof value === 'string' && value.trim().length > 0)
            .map((value) => value.trim());

        const combinedListings = [...pending, ...revision, ...awaitingReapproval];
        const locationsFromResponse = collectLocations(combinedListings);
        const categoriesFromResponse = collectCategories(combinedListings);

        const availableFilters = res.data?.availableFilters ?? {};

        setAllLocations((prev) => {
          const merged = new Set(prev);

          if (Array.isArray(availableFilters.locations)) {
            availableFilters.locations
              .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
              .forEach((value: string) => merged.add(value.trim()));
          }

          locationsFromResponse.forEach((value) => merged.add(value));

          return Array.from(merged);
        });

        setAllCategories((prev) => {
          const merged = new Set(prev);

          if (Array.isArray(availableFilters.categories)) {
            availableFilters.categories
              .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
              .forEach((value: string) => merged.add(value.trim()));
          }

          categoriesFromResponse.forEach((value) => merged.add(value));

          return Array.from(merged);
        });
      } catch (error) {
        console.error('[MODERATION_FETCH_LISTINGS]', error);
        toast.error("Couldn't fetch listings");
      } finally {
        setIsFetchingListings(false);
      }
    },
    []
  );

  const refreshListingsWithFilters = useCallback(() => {
    fetchListings(filters);
  }, [fetchListings, filters]);

  const handleModeratorDeactivate = useCallback(async () => {
    const listingId = moderListingId.trim();

    if (!listingId) {
      toast.error('Please provide a listing ID.');
      return;
    }

    setIsDeactivatingListing(true);

    try {
      const response = await axios.post('/api/moderation/listings/deactivate', {
        listingId,
      });

      const alreadyInactive = Boolean(response.data?.alreadyInactive);

      if (alreadyInactive) {
        toast('Listing is already inactive.');
      } else {
        toast.success('Listing has been set to inactive.');
      }

      setModerListingId('');
      refreshListingsWithFilters();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? typeof error.response?.data === 'string'
          ? error.response?.data
          : (error.response?.data as { error?: string })?.error || 'Failed to deactivate listing.'
        : 'Failed to deactivate listing.';
      toast.error(message);
    } finally {
      setIsDeactivatingListing(false);
      setShowListingDeactivateConfirm(false);
    }
  }, [moderListingId, refreshListingsWithFilters]);

  const resolveUserId = useCallback(
    async (identifier: string, context: string) => {
      const trimmed = identifier.trim();

      if (!trimmed) {
        toast.error(`Please provide a ${context}.`);
        return null;
      }

      const looksLikeId = /^[0-9a-f]{24}$/i.test(trimmed);
      if (looksLikeId) {
        return trimmed;
      }

      try {
        const response = await axios.get('/api/users/resolve', { params: { identifier: trimmed } });
        const resolved = response.data?.userId;
        if (typeof resolved === 'string' && resolved.trim()) {
          return resolved.trim();
        }
        toast.error(`Could not resolve ${context}.`);
        return null;
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? typeof error.response?.data === 'string'
            ? error.response?.data
            : (error.response?.data as { error?: string })?.error || `Unable to resolve ${context}.`
          : `Unable to resolve ${context}.`;
        toast.error(message);
        return null;
      }
    },
    [],
  );

  const handleSuspendAccount = useCallback(async () => {
    const userId = await resolveUserId(moderSuspendUserId, 'user');

    if (!userId) {
      toast.error('Please provide a user ID.');
      return;
    }

    setIsSuspendingUser(true);

    try {
      await axios.post('/api/moderation/users/suspend', {
        userId,
        suspend: true,
      });

      toast.success('Account suspended successfully.');
      setModerSuspendUserId('');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? typeof error.response?.data === 'string'
          ? error.response?.data
          : (error.response?.data as { error?: string })?.error || 'Failed to suspend account.'
        : 'Failed to suspend account.';
      toast.error(message);
    } finally {
      setIsSuspendingUser(false);
      setShowSuspendConfirmPopup(false);
    }
  }, [moderSuspendUserId, resolveUserId]);

  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' });
    } catch {
      return undefined;
    }
  }, []);

  const applyFilters = useCallback(
    (next: Partial<{ location: string; category: string }>) => {
      setFilters((prev) => {
        const updated = { ...prev, ...next };
        fetchListings(updated);
        return updated;
      });
    },
    [fetchListings]
  );

  const togglePinnedCategory = useCallback((label: string) => {
    setPinnedCategories((prev) => {
      if (prev.includes(label)) {
        return prev.filter((item) => item !== label);
      }
      if (prev.length >= MAX_PINNED_CATEGORIES) {
        toast.error(`You can only pin ${MAX_PINNED_CATEGORIES} categories.`);
        return prev;
      }
      return [...prev, label];
    });
  }, []);

  const resetFilters = useCallback(() => {
    const cleared = { location: '', category: '' };
    setFilters(cleared);
    fetchListings(cleared);
  }, [fetchListings]);

  const parseLocationValue = useCallback(
    (value?: string | null) => {
      if (!value) return null;

      const segments = String(value)
        .split('-')
        .map((segment) => segment.trim())
        .filter(Boolean);

      if (segments.length === 0) return null;

      const countryCode = segments.pop()?.toUpperCase() || '';
      const citySlug = segments.join('-');
      const city = citySlug
        ? citySlug
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
        : '';

      const countryName = countryCode
        ? regionNames?.of?.(countryCode) ?? countryCode
        : '';

      return {
        city,
        countryCode,
        countryName,
      };
    },
    [regionNames]
  );

  const formatLocationValue = useCallback(
    (value?: string | null) => {
      if (!value) return '';
      const parsed = parseLocationValue(value);
      if (!parsed) return value;
      if (parsed.city) {
        return parsed.countryName ? `${parsed.city}, ${parsed.countryName}` : parsed.city;
      }
      return parsed.countryName || value;
    },
    [parseLocationValue]
  );

  const formatListingLocation = useCallback(
    (listing: Listing) => {
      if (listing?.location?.label) {
        return listing.location.label;
      }
      if (listing?.location?.city && listing?.location?.country) {
        return `${listing.location.city}, ${listing.location.country}`;
      }
      if (listing?.location?.city) {
        return listing.location.city;
      }
      if (listing?.locationValue) {
        return formatLocationValue(listing.locationValue);
      }
      return '';
    },
    [formatLocationValue]
  );

  const locationOptions = useMemo(() => {
    const unique = Array.from(new Set(allLocations)).filter((value) => value.trim().length > 0);
    unique.sort((a, b) => formatLocationValue(a).localeCompare(formatLocationValue(b)));
    return unique.map((value) => ({ value, label: formatLocationValue(value) }));
  }, [allLocations, formatLocationValue]);

  const categoryOptions = useMemo(() => {
    const unique = Array.from(new Set(allCategories)).filter((value) => value.trim().length > 0);
    unique.sort((a, b) => a.localeCompare(b));
    return unique.map((value) => ({ value, label: toTitleCase(value.replace(/_/g, ' ')) }));
  }, [allCategories]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  );

  useEffect(() => {
    setPinnedCategories(readPinnedCategoriesFromStorage());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const safePinned = pinnedCategories.slice(0, MAX_PINNED_CATEGORIES);
    window.localStorage.setItem(PINNED_CATEGORIES_STORAGE_KEY, JSON.stringify(safePinned));
    window.dispatchEvent(new Event('storage'));
  }, [pinnedCategories]);

  const formatTimestamp = useCallback(
    (value?: string) => {
      if (!value) return '—';
      try {
        return dateFormatter.format(new Date(value));
      } catch {
        return '—';
      }
    },
    [dateFormatter]
  );

  const STATUS_META: Record<
    ModerationStatusKey,
    {
      badgeLabel: string;
      badgeClass: string;
      noteTitle: string;
      noteBody: string;
      tabLabel: string;
      tabPing: string;
      tabDot: string;
      timelineLabel: string;
      timelineSource: 'createdAt' | 'updatedAt';
    }
  > = {
    pending: {
      badgeLabel: 'Pending review',
      badgeClass: 'bg-amber-500/95 text-white',
      noteTitle: 'New submission',
      noteBody:
        'This experience is awaiting its first moderation review. Approve it to go live or request changes from the host.',
      tabLabel: 'Pending listings',
      tabPing: 'bg-emerald-400',
      tabDot: 'bg-emerald-500',
      timelineLabel: 'Submitted on',
      timelineSource: 'createdAt',
    },
    revision: {
      badgeLabel: 'Revision request',
      badgeClass: 'bg-blue-600/90 text-white',
      noteTitle: 'Revision updates',
      noteBody:
        'The host has resubmitted updates for this experience. Compare the latest details before approving the changes.',
      tabLabel: 'Revision requests',
      tabPing: 'bg-amber-400',
      tabDot: 'bg-amber-500',
      timelineLabel: 'Revision submitted',
      timelineSource: 'updatedAt',
    },
    awaiting_reapproval: {
      badgeLabel: 'Awaiting re-approval',
      badgeClass: 'bg-purple-600/90 text-white',
      noteTitle: 'Reactivation pending',
      noteBody:
        'This listing was reactivated by the host and needs a fresh moderation pass before it can return to the marketplace.',
      tabLabel: 'Activate requests',
      tabPing: 'bg-purple-400',
      tabDot: 'bg-purple-500',
      timelineLabel: 'Reactivation requested',
      timelineSource: 'updatedAt',
    },
  };

  const displayedListings = useMemo(() => {
    switch (statusFilter) {
      case 'revision':
        return revisionListings;
      case 'awaiting_reapproval':
        return awaitingReapprovalListings;
      default:
        return pendingListings;
    }
  }, [awaitingReapprovalListings, pendingListings, revisionListings, statusFilter]);

  const hasActiveFilters = filters.location !== '' || filters.category !== '';

  const handleApprove = async (listingId: string) => {
    setIsLoading(true);
    try {
      await axios.post(`/api/listings/${listingId}/approve`);
      toast.success('Listing approved', {
        iconTheme: {
            primary: '#2200ffff',
            secondary: '#fff',
        }
      });
      await fetchListings(filters);
    } catch (error: any) {
      console.error('❌ Approve error:', error);
      toast.error(error?.response?.data || 'Failed to approve');
    } finally {
      setIsLoading(false);
    }
  };  

  const handleReject = async (listingId: string) => {
    setIsLoading(true);
    try {
      await axios.post(`/api/listings/${listingId}/reject`);
      toast.success('Listing rejected', {
        iconTheme: {
            primary: '#2200ffff',
            secondary: '#fff',
        }
      });
      await fetchListings(filters);
    } catch (error: any) {
      console.error('Reject failed:', error);
      toast.error('Failed to reject');
    } finally {
      setIsLoading(false);
    }
  };  

  const handleWithdraw = async (identifier: string) => {
    const userId = await resolveUserId(identifier, 'promoter');

    if (!userId) return;

    try {
      const res = await axios.post('/api/analytics/withdraw', { userId });
      toast.success(res.data.message, {
        iconTheme: {
          primary: '#2200ffff',
          secondary: '#fff',
        },
      });
      
      setPromoterUserId('');
    } catch {
      toast.error('Failed to withdraw for this promoter.');
    }
  };

  const handleAttachmentUpload = (
    event: ChangeEvent<HTMLInputElement>,
    setter: (value: { name: string; data: string } | null) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setter(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setter(result ? { name: file.name, data: result } : null);
    };
    reader.onerror = () => setter(null);
    reader.readAsDataURL(file);
  };

  const handlePayoutPromoter = async () => {
    const numericAmount = Number(promoterPayoutAmount);

    if (!promoterUserId || !promoterPayoutAmount || Number.isNaN(numericAmount)) {
      toast.error('Provide promoter username/userId and amount.');
      return;
    }

    try {

      const userId = await resolveUserId(promoterUserId, 'promoter');
      if (!userId) return;

      const res = await axios.post('/api/analytics/payout', {
        userId: promoterUserId,
        amount: numericAmount,
        currency: BASE_CURRENCY,
        note: promoterPayoutNote,
        attachmentUrl: promoterAttachment?.data,
        attachmentName: promoterAttachment?.name,
      });

      toast.success(res.data?.message ?? 'Payout sent', {
        iconTheme: {
          primary: '#10b981',
          secondary: '#fff',
        },
      });
      setPromoterPayoutAmount('');
      setPromoterUserId('');
      setPromoterPayoutNote('');
      setPromoterAttachment(null);
    } catch (error) {
      console.error('Failed to process promoter payout', error);
      toast.error('Failed to process promoter payout.');
    }
  };

  const handleWithdrawForHosts = async (identifier: string) => {
    const userId = await resolveUserId(identifier, 'host');
    if (!userId) return;

    try {
      const res = await axios.post('/api/analytics/host/withdraw', { userId });
      toast.success(res.data.message, {
        iconTheme: {
          primary: '#2200ffff',
          secondary: '#fff',
        },
      });      
      setHostUserId('');
    } catch {
      toast.error('Failed to withdraw for this host.');
    }
  };

  const handlePayoutHost = async () => {
    const numericAmount = Number(hostPayoutAmount);

    if (!hostUserId || !hostPayoutAmount || Number.isNaN(numericAmount)) {
      toast.error('Provide host username/userId and amount.');
      return;
    }

    try {

      const userId = await resolveUserId(hostUserId, 'host');
      if (!userId) return;
      
      const res = await axios.post('/api/analytics/host/payout', {
        userId: hostUserId,
        amount: numericAmount,
        currency: BASE_CURRENCY,
        note: hostPayoutNote,
        attachmentUrl: hostAttachment?.data,
        attachmentName: hostAttachment?.name,
      });

      toast.success(res.data?.message ?? 'Payout sent', {
        iconTheme: {
          primary: '#10b981',
          secondary: '#fff',
        },
      });
      setHostPayoutAmount('');
      setHostUserId('');
      setHostPayoutNote('');
      setHostAttachment(null);
    } catch (error) {
      console.error('Failed to process host payout', error);
      toast.error('Failed to process host payout.');
    }
  };

  const handleUserAnalytics = async () => {
    try {
      const res = await axios.post('/api/analytics/host/get', { identifier: userLookup });
      const payout = await axios.post('/api/users/get-payout-method', { identifier: res.data.userId });
      const userDetails = await axios.get('/api/moderation/users/lookup', {
        params: { identifier: userLookup },
      });

      const data = res.data ?? {};
      const puntiValue = Number(data.punti);
      const punti = Number.isFinite(puntiValue) ? puntiValue : 0;
      const puntiShareValue = Number(data.puntiShare);
      const puntiShare = Number.isFinite(puntiShareValue)
        ? Math.min(1, Math.max(0, puntiShareValue))
        : 0;
      const partnerCommissionValue = Number(data.partnerCommission);
      const partnerCommission = Number.isFinite(partnerCommissionValue)
        ? partnerCommissionValue
        : MIN_PARTNER_COMMISSION;
  
      setUserAnalytics({
        // totalBooks: res.data.totalBooks,
        // totalRevenue: res.data.totalRevenue,
        totalBooks: Number(data.totalBooks ?? 0),
        totalRevenue: Number(data.totalRevenue ?? 0),
        payoutMethod: payout?.data?.method || 'None',
        payoutNumber: payout?.data?.number || '',
        userId: data.userId || '',
        userRole: data.userRole,
        username: data.username,
        userEmail: data.userEmail,
        referenceId: data.referenceId,
        punti,
        puntiShare,
        partnerCommission,
        puntiLabel: typeof data.puntiLabel === 'string' ? data.puntiLabel : getPuntiLabel(punti),
        platformRelevance: data.platformRelevance,
        breakdown: data.breakdown,
        currency: data.currency,
      });
      setUserRecord(userDetails.data?.user ?? null);
    } catch (err) {
      toast.error('User not found or error fetching data');
      setUserRecord(null);
    }
  };
  
  const handlePromoterAnalytics = async () => {
    try {
      const res = await axios.post('/api/analytics/get', { identifier: promoterLookup });
      const payout = await axios.post('/api/users/get-payout-method', { identifier: res.data.userId });
  
      setPromoterAnalytics({
        totalBooks: res.data.totalBooks,
        qrScans: res.data.qrScans,
        totalRevenue: res.data.totalRevenue,
        payoutMethod: payout?.data?.method || 'None',
        payoutNumber: payout?.data?.number || '',
        userId: res.data.userId || '',
      });
    } catch (err) {
      toast.error('Promoter not found or error fetching data');
    }
  };  

  const handleFetchReservationDetails = async () => {
    const reservationId = reservationLookupId.trim();

    if (!reservationId) {
      toast.error('Please provide a reservation ID.');
      return;
    }

    setIsFetchingReservation(true);
    setReservationDetails([]);

    try {
      const res = await axios.get(`/api/reservations/${reservationId}`);
      setReservationDetails(res.data ? [res.data] : []);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data || 'Could not fetch reservation.'
        : 'Could not fetch reservation.';
      toast.error(typeof message === 'string' ? message : 'Could not fetch reservation.');
    } finally {
      setIsFetchingReservation(false);
    }
  };

  const handleFetchReservationsByUsername = async () => {
    const username = reservationLookupUsername.trim();

    if (!username) {
      toast.error('Please provide a username.');
      return;
    }

    setIsFetchingReservation(true);
    setReservationDetails([]);

    try {
      const res = await axios.get('/api/moderation/reservations/lookup', {
        params: { identifier: username },
      });

      setReservationDetails(Array.isArray(res.data?.reservations) ? res.data.reservations : []);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data || 'Could not fetch reservations.'
        : 'Could not fetch reservations.';
      toast.error(typeof message === 'string' ? message : 'Could not fetch reservations.');
    } finally {
      setIsFetchingReservation(false);
    }
  };

  const handleFetchListingDetails = async () => {
    const listingId = listingLookupId.trim();

    if (!listingId) {
      toast.error('Please provide a listing ID.');
      return;
    }

    setIsFetchingListing(true);
    setListingDetails([]);

    try {
      const res = await axios.get(`/api/listings/${listingId}`);
      setListingDetails(res.data ? [res.data] : []);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data || 'Could not fetch listing.'
        : 'Could not fetch listing.';
      toast.error(typeof message === 'string' ? message : 'Could not fetch listing.');
    } finally {
      setIsFetchingListing(false);
    }
  };

  const handleFetchListingsByUsername = async () => {
    const username = listingLookupUsername.trim();

    if (!username) {
      toast.error('Please provide a username.');
      return;
    }

    setIsFetchingListing(true);
    setListingDetails([]);

    try {
      const res = await axios.get('/api/moderation/listings/lookup', {
        params: { identifier: username },
      });

      setListingDetails(Array.isArray(res.data?.listings) ? res.data.listings : []);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data || 'Could not fetch listings.'
        : 'Could not fetch listings.';
      toast.error(typeof message === 'string' ? message : 'Could not fetch listings.');
    } finally {
      setIsFetchingListing(false);
    }
  };

  const handlePuntiUpdate = async () => {
    const listingId = puntiUpdate.listingId.trim();

    if (!listingId) {
      toast.error('Please provide a listing ID.');
      return;
    }

    const puntiValue = Number(puntiUpdate.punti);
    if (!Number.isFinite(puntiValue)) {
      toast.error('Enter a valid punti value.');
      return;
    }

    const puntiToAddRequested = Math.max(0, Math.floor(puntiValue));

    if (puntiToAddRequested <= 0) {
      toast.error('Enter a punti amount greater than 0 to add.');
      return;
    }

    setIsUpdatingPunti(true);
    setPuntiResult(null);

    try {

      const listingResponse = await axios.get(`/api/listings/${listingId}`);
      const existingPunti = Number(listingResponse.data?.punti);
      const currentPunti = Number.isFinite(existingPunti)
        ? Math.max(0, Math.floor(existingPunti))
        : 0;

      setCurrentListingPunti(currentPunti);

      const availableToAdd = Math.max(0, MAX_PARTNER_POINT_VALUE - currentPunti);

      if (availableToAdd <= 0) {
        toast('Listing is already at the maximum punti.');
        setPuntiResult({ added: 0, total: currentPunti });
        return;
      }

      const puntiToAdd = Math.min(puntiToAddRequested, availableToAdd);

      const response = await axios.post('/api/moderation/listings/punti', {
        listingId,
        puntiToAdd
      });

      const puntiAdded = Number.isFinite(Number(response.data?.puntiAdded))
        ? Number(response.data.puntiAdded)
        : puntiToAdd;
      const updatedTotal = Number.isFinite(Number(response.data?.punti))
        ? Number(response.data.punti)
        : Math.min(MAX_PARTNER_POINT_VALUE, currentPunti + puntiAdded);

      toast.success(`Added ${puntiAdded} punti to the listing.`);

      setPuntiResult({ added: puntiAdded, total: updatedTotal });
      setCurrentListingPunti(updatedTotal);
      setPuntiUpdate((prev) => ({ ...prev, punti: '' }));

      const metrics = response.data?.metrics;
      const userId = response.data?.userId;

      if (metrics && userId && userAnalytics?.userId === userId) {
        setUserAnalytics((prev: any) => {
          if (!prev) return prev;

          const updatedPunti = Number(metrics.punti);
          const updatedShare = Number(metrics.puntiShare);
          const updatedCommission = Number(metrics.partnerCommission);

          return {
            ...prev,
            punti: Number.isFinite(updatedPunti) ? updatedPunti : prev.punti ?? 0,
            puntiShare: Number.isFinite(updatedShare)
              ? Math.min(1, Math.max(0, updatedShare))
              : prev.puntiShare ?? 0,
            partnerCommission: Number.isFinite(updatedCommission)
              ? updatedCommission
              : prev.partnerCommission ?? MIN_PARTNER_COMMISSION,
            puntiLabel:
              typeof metrics.puntiLabel === 'string'
                ? metrics.puntiLabel
                : getPuntiLabel(Number.isFinite(updatedPunti) ? updatedPunti : 0),
          };
        });
      }
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? typeof error.response?.data === 'string'
          ? error.response?.data
          : (error.response?.data as { message?: string })?.message || 'Failed to update punti.'
        : 'Failed to update punti.';
      toast.error(message);
    } finally {
      setIsUpdatingPunti(false);
    }
  };

  const puntiNumeric = Number(puntiUpdate.punti);
  const puntiPreview = Number.isFinite(puntiNumeric) ? puntiNumeric : 0;
  const availablePuntiToAdd =
    currentListingPunti === null
      ? MAX_PARTNER_POINT_VALUE
      : Math.max(0, MAX_PARTNER_POINT_VALUE - currentListingPunti);
  const safePuntiPreview = Math.max(
    0,
    Math.min(availablePuntiToAdd || MAX_PARTNER_POINT_VALUE, Math.round(puntiPreview)),
  );

  useEffect(() => {
    if (currentUser?.role === 'moder') {
      fetchListings();
    }
  }, [currentUser, fetchListings]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get('/api/analytics/platform');
      const platform = res.data;

      const normalize = (arr: any[]) =>
        arr.map((entry) => ({
          date: entry.date,
          revenue: Number(entry.revenue || 0),
          platformFee: Number(entry.platformFee || 0),
          bookingCount: Number(entry.bookingCount || 0),
        }));

      setPlatformData({
        daily: normalize(platform.daily),
        monthly: normalize(platform.monthly),
        yearly: normalize(platform.yearly),
        totalRevenue: Number(platform.totalRevenue ?? 0),
        partnerCommission: Number(platform.partnerCommission ?? MIN_PARTNER_COMMISSION),
        punti: Number(platform.punti ?? 0),
        puntiShare: Number(platform.puntiShare ?? 0),
        puntiLabel: typeof platform.puntiLabel === 'string'
          ? platform.puntiLabel
          : getPuntiLabel(Number(platform.punti ?? 0)),
      });
    };

    fetchData();
  }, []);

  const onCancel = async (id: string) => {
    if (!id) return toast.error('Reservation ID required');
  
    try {
      setIsLoading(true);
  
      // 🔍 Fetch reservation to determine host and totalPrice
      const res = await axios.get(`/api/reservations/${id}`);
      const reservation = res.data;
      const referralId = reservation?.referralId;
      const totalPrice = reservation?.totalPrice ?? 0;
      const hostId = reservation?.listing?.userId;
  
      // ❌ Delete reservation
      // await axios.delete(`/api/reservations/${id}`);
      await axios.patch(`/api/reservations/${id}/cancel`, {
        note: cancellationNote,
        attachments: cancellationAttachment ? [cancellationAttachment] : [],
      });
      toast.success('Reservation cancelled', {
        iconTheme: { primary: '#2200ffff', secondary: '#fff' },
      });

      await axios.post('/api/analytics/remove-reservation', {
        reservationId: id
      });
      await axios.post('/api/analytics/platform/remove', { reservationId: id });
      await axios.post('/api/analytics/earnings/remove', { reservationId: id });
  
      // 📉 Decrement referral analytics if referralId exists
      if (referralId) {
        await axios.post('/api/analytics/decreament', {
          reservationId: id,
          totalBooksIncrement: -1,
          totalRevenueIncrement: -totalPrice,
        });
      }
  
      // 📉 Decrement host analytics if hostId exists
      if (hostId && totalPrice) {
        await axios.post('/api/analytics/host/decrement', {
          hostId,
          totalPrice,
        });
      }
  
      setSelectedReservationId('');
      setCancellationNote('');
      setCancellationAttachment(null);
      router.refresh();
    } catch (error) {
      const err = error as AxiosError<{ error?: string }>;
      toast.error(err.response?.data?.error || 'Cancellation failed.');
    } finally {
      setIsLoading(false);
    }
  };  

  // if (!currentUser || currentUser.role !== 'moder') {
  //   router.push('/');
  //   // return <p className="text-center text-neutral-500 py-10">Unauthorized or loading...</p>;
  // }

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'moder') {
      router.push('/');
    }
  }, [currentUser, router]);

  const renderListingCard = (listing: Listing) => {
    const media = Array.isArray(listing.imageSrc)
      ? listing.imageSrc.filter((src): src is string => typeof src === 'string' && src.trim().length > 0)
      : [];
    const imageSlides = media.filter((src) => !/\.(mp4|webm|mov)$/i.test(src));

    const safePricingType: 'fixed' | 'group' | 'custom' | null =
      listing.pricingType === 'fixed' ||
      listing.pricingType === 'group' ||
      listing.pricingType === 'custom'
        ? listing.pricingType
        : 'fixed';

    const locationDisplay = formatListingLocation(listing);
    const categories = Array.from(
      new Set(
        [
          ...(Array.isArray(listing.category)
            ? listing.category.filter((value): value is string => typeof value === 'string')
            : []),
          ...(typeof listing.primaryCategory === 'string' ? [listing.primaryCategory] : []),
        ].map((value) => value.replace(/_/g, ' '))
      )
    );

    // 🔧 add this
    const formattedCategories = categories.map((category) => toTitleCase(category));

    const safeCustomPricing: ListingLike['customPricing'] =
      (listing.customPricing ?? null) as ListingLike['customPricing'];

    const pricing = getDisplayPricing({
      price: listing.price ?? 0,
      pricingType: safePricingType,
      groupPrice: listing.groupPrice ?? null,
      groupSize: listing.groupSize ?? null,
      customPricing: safeCustomPricing,
      guestCount: listing.guestCount,
    });

    const pricingLabel = `${formatConverted(pricing.unitPrice)} ${pricing.suffix.toUpperCase()}`;
    const pricingDescriptor = pricing.descriptor;

    const locationTypesDisplay = Array.isArray(listing.locationType)
      ? listing.locationType
          .map((type) => {
            if (!type) return null;
            if (type.toUpperCase() === 'HISTORIC_SITE') {
              return 'Historic site';
            }
            return toTitleCase(type.replace(/_/g, ' '));
          })
          .filter(Boolean)
          .join(', ')
      : '';

    const submittedAt = formatTimestamp(listing.createdAt);
    const updatedAt = formatTimestamp(listing.updatedAt);

    const resolvedStatus: ModerationStatusKey =
      listing.status === 'revision'
        ? 'revision'
        : listing.status === 'awaiting_reapproval'
        ? 'awaiting_reapproval'
        : 'pending';

    const badgeMeta = STATUS_META[resolvedStatus];
    const noteMeta = STATUS_META[statusFilter];

    const timelineLabel = noteMeta.timelineLabel;
    const timelineValue = noteMeta.timelineSource === 'updatedAt' ? updatedAt : submittedAt;

    const detailRows = [
      {
        label: 'Location',
        value: locationDisplay,
        span: true,
      },
      {
        label: 'Guest capacity',
        value: listing.guestCount ? `${listing.guestCount} guests` : '',
        span: false,
      },
      {
        label: 'Pricing',
        value: pricingDescriptor ? `${pricingLabel} · ${pricingDescriptor}` : pricingLabel,
        span: false,
      },
      {
        label: 'Experience length',
        value:
          typeof listing.experienceHour === 'number' || (typeof listing.experienceHour === 'string' && listing.experienceHour)
            ? `${listing.experienceHour} hours`
            : '',
        span: false,
      },
      {
        label: 'Languages',
        value: Array.isArray(listing.languages) && listing.languages.length > 0 ? listing.languages.join(', ') : '',
        span: false,
      },
      {
        label: 'Location types',
        value: locationTypesDisplay,
        span: false,
      },
      {
        label: 'Meeting point',
        value: listing.meetingPoint || '',
        span: true,
      },
      {
        label: 'Host notes',
        value: listing.hostDescription || '',
        span: true,
      },
      {
        label: 'Location description',
        value: listing.locationDescription || '',
        span: true,
      },
      {
        label: timelineLabel,
        value: timelineValue,
        span: false,
      },
    ];

    const filteredDetailRows = detailRows.filter((row) => {
      if (row.label === timelineLabel) {
        return true;
      }
      return row.value && String(row.value).trim().length > 0;
    });

    return (
      <article
        key={listing.id}
        className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-neutral-200/70"
      >
        <div className="relative w-full overflow-hidden bg-neutral-100">
          {media.length > 0 ? (
            <Slider {...MEDIA_SLIDER_SETTINGS} className="w-full">
              {media.map((src, index) => {
                const isVideo = /\.(mp4|webm|mov)$/i.test(src);
                const imageIndex = imageSlides.indexOf(src);
                return (
                  <div key={`${listing.id}-${index}`} className="relative aspect-[4/3] w-full">
                    {isVideo ? (
                      <video
                        src={src}
                        controls
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (imageIndex !== -1) {
                            openLightbox(imageSlides, imageIndex);
                          }
                        }}
                        className="relative block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
                      >
                        <Image
                          src={src}
                          alt={`${listing.title}-${index}`}
                          fill
                          className="object-cover"
                          sizes="(min-width: 768px) 704px, 100vw"
                          unoptimized
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </Slider>
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500">
              No media provided
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 via-black/25 to-transparent px-6 py-5 text-white">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Submitted by</p>
            <p className="text-sm font-semibold">{listing.user.name}</p>
            <p className="text-xs text-white/75">{listing.user.email}</p>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 z-10">
            <span
              className={clsx(
                'inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide shadow-md backdrop-blur',
                badgeMeta.badgeClass
              )}
            >
              {badgeMeta.badgeLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-neutral-900">{listing.title}</h2>
          </div>

          {listing.description && (
            <p className="text-sm leading-relaxed text-neutral-600">{listing.description}</p>
          )}

          {filteredDetailRows.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredDetailRows.map((row) => (
                <div
                  key={`${listing.id}-${row.label}`}
                  className={clsx(
                    'rounded-2xl border border-neutral-200/70 bg-neutral-50 px-4 py-3',
                    row.span ? 'md:col-span-2' : ''
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{row.label}</p>
                  <p className="mt-2 text-sm font-medium text-neutral-800">{row.value || '—'}</p>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-5 py-4 text-sm leading-relaxed text-neutral-600">
            <p className="text-sm font-semibold text-neutral-900">{noteMeta.noteTitle}</p>
            <p className="mt-2">{noteMeta.noteBody}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-neutral-100 bg-neutral-50 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-500">
            {/* <span>
              {timelineLabel}: {timelineValue}
            </span> */}
            <span>
              Category: {formattedCategories.length > 0 ? formattedCategories.join(', ') : '—'}
            </span>
            {noteMeta.timelineSource === 'updatedAt' && <span>Last update: {updatedAt}</span>}
            {/* {locationTypesDisplay && <span>Types: {locationTypesDisplay}</span>} */}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleApprove(listing.id)}
              disabled={isLoading}
              className="rounded-full border border-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-600 shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(listing.id)}
              disabled={isLoading}
              className="rounded-full border border-neutral-800 px-5 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-800 hover:text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <>
    <div className="px-5 md:px-20 pt-2 md:pt-10 pb-0">
      <PlatformCard
          daily={platformData.daily}
          monthly={platformData.monthly}
          yearly={platformData.yearly}
          totalRevenue={platformData.totalRevenue}
          partnerCommission={platformData.partnerCommission}
          punti={platformData.punti}
          puntiShare={platformData.puntiShare}
          puntiLabel={platformData.puntiLabel}
        />
      </div>
    <div className="mx-auto grid max-w-full grid-cols-1 gap-10 px-6 py-10 md:px-20 lg:grid-cols-12">
      <section className="space-y-8 lg:col-span-8">
        <div className="rounded-3xl bg-white px-6 py-6 shadow-lg ring-1 ring-neutral-200/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Moderation queue</h1>
              <p className="text-sm text-neutral-500">
                Track new submissions and revision requests in one place.
              </p>
            </div>
           <div className="flex flex-col items-end gap-3 text-sm text-neutral-600 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                {/* <span className="rounded-full bg-neutral-900/5 px-3 py-1 font-semibold text-neutral-800">
                  Pending: {pendingListings.length}
                </span>
                <span className="rounded-full bg-neutral-900/5 px-3 py-1 font-semibold text-neutral-800">
                  Revision: {revisionListings.length}
                </span>
                <span className="rounded-full bg-neutral-900/5 px-3 py-1 font-semibold text-neutral-800">
                  Re-approval: {awaitingReapprovalListings.length}
                </span> */}
              </div>
              <button
                type="button"
                onClick={() => router.push('/moderation-queue')}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-500 hover:text-neutral-900"
              >
                <span className="text-xs">Open queue page</span>
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
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end">
            <label className="flex w-full flex-col gap-2 text-sm font-medium text-neutral-600 md:w-1/2">
              Location
              <select
                value={filters.location}
                onChange={(event) => applyFilters({ location: event.target.value })}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="">All locations</option>
                {locationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex w-full flex-col gap-2 text-sm font-medium text-neutral-600 md:w-1/2">
              Category
              <select
                value={filters.category}
                onChange={(event) => applyFilters({ category: event.target.value })}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="">All categories</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="h-[42px] rounded-full border border-neutral-300 px-4 text-sm font-semibold text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Pinned categories</p>
                <p className="text-xs text-neutral-500">
                  Choose up to {MAX_PINNED_CATEGORIES} categories to feature next to the marketplace filters.
                </p>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                {pinnedCategories.length}/{MAX_PINNED_CATEGORIES}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {NAV_CATEGORIES.map((option) => {
                const isPinned = pinnedCategories.includes(option.label);
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => togglePinnedCategory(option.label)}
                    className={clsx(
                      'rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition',
                      isPinned
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-blue-200'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:text-neutral-900'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" aria-hidden="true" />
                      <span className="line-clamp-1 max-w-[150px] text-left">{option.label}</span>
                      {isPinned && <span className="text-[10px] uppercase">Pinned</span>}
                    </span>
                  </button>
                );
              })}
              {pinnedCategories.length === 0 && (
                <span className="text-xs text-neutral-400">No categories pinned yet.</span>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
            {(['pending', 'revision', 'awaiting_reapproval'] as ModerationStatusKey[]).map((key) => {
              const isActive = statusFilter === key;
              const meta = STATUS_META[key];
              const count =
                key === 'pending'
                  ? pendingListings.length
                  : key === 'revision'
                  ? revisionListings.length
                  : awaitingReapprovalListings.length;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={clsx(
                    'flex items-center gap-3 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'border-black bg-black text-white shadow-md'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  )}
                >
                  {isActive && (
                    <div className="relative flex h-3.5 w-3.5 items-center justify-center">
                      <span
                        className={clsx(
                          'absolute inline-flex h-3.5 w-3.5 rounded-full opacity-75 animate-ping',
                          meta.tabPing
                        )}
                      />
                      <span
                        className={clsx(
                          'relative inline-flex h-3.5 w-3.5 rounded-full shadow-md',
                          meta.tabDot
                        )}
                      />
                    </div>
                  )}
                  <span>{meta.tabLabel}</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-inherit">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[65vh] space-y-6 overflow-y-auto pr-2 pb-1 md:h-[75vh]">
          {isFetchingListings ? (
            <div className="rounded-3xl border border-dashed border-neutral-200 bg-white/70 p-10 text-center text-sm text-neutral-500">
              Loading listings...
            </div>
          ) : displayedListings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-200 bg-white/70 p-10 text-center text-sm text-neutral-500">
              No listings match the current filters.
            </div>
          ) : (
            displayedListings.map(renderListingCard)
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 pt-2 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/60 lg:col-span-3">
            <h2 className="text-lg font-bold text-black">Adjust Listing Punti</h2>
            <p className="text-sm text-neutral-600">
              Add punti to a listing without changing host commission. Additions are capped at {MAX_PARTNER_POINT_VALUE} punti per listing.
            </p>
            <input
              type="text"
              placeholder="Enter listingId"
              value={puntiUpdate.listingId}
              onChange={(event) => {
                setPuntiUpdate((prev) => ({ ...prev, listingId: event.target.value }));
                setCurrentListingPunti(null);
                setPuntiResult(null);
              }}
              className="w-full p-2 border rounded-xl"
            />

            <div className="text-xs text-neutral-600 space-y-1">
              <p>
                Current punti: {currentListingPunti === null ? '— (fetched on add)' : `${currentListingPunti} / ${MAX_PARTNER_POINT_VALUE}`}
              </p>
              <p>Available to add now: {availablePuntiToAdd}</p>
            </div>

            <div className="space-y-3">
              <input
                type="number"
                min={0}
                max={availablePuntiToAdd || MAX_PARTNER_POINT_VALUE}
                value={puntiUpdate.punti}
                onChange={(event) => setPuntiUpdate((prev) => ({ ...prev, punti: event.target.value }))}
                className="w-full p-2 border rounded-xl"
                placeholder={`0 - ${MAX_PARTNER_POINT_VALUE}`}
              />
              <input
                type="range"
                min={0}
                max={MAX_PARTNER_POINT_VALUE}
                value={safePuntiPreview}
                onChange={(event) =>
                  setPuntiUpdate((prev) => ({ ...prev, punti: event.target.value }))
                }
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span>Pending add: {safePuntiPreview} punti</span>
              <span>Listing cap: {MAX_PARTNER_POINT_VALUE} punti</span>
            </div>
            {puntiResult && (
              <div className="text-xs text-emerald-700 bg-emerald-50 rounded-xl p-3 mt-3">
                <p>Added: {puntiResult.added} punti.</p>
                <p>Listing total: {puntiResult.total} / {MAX_PARTNER_POINT_VALUE}.</p>
              </div>
            )}
            <button
              onClick={handlePuntiUpdate}
              disabled={isUpdatingPunti}
              className="w-full py-2 bg-neutral-900 text-white rounded-xl shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdatingPunti ? 'Adding…' : 'Add punti'}
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/60">
            <h2 className="text-lg font-bold text-black">Moderator Listing Deactivation</h2>
            <p className="text-sm text-neutral-600">
              Deactivate a listing immediately by providing its listing ID. The listing status will be set to inactive.
            </p>
            <input
              type="text"
              placeholder="Enter listingId"
              value={moderListingId}
              onChange={(event) => setModerListingId(event.target.value)}
              className="w-full p-2 border rounded-xl"
            />
            <button
              onClick={() => {
                if (!moderListingId.trim()) {
                  toast.error('Please provide a listing ID.');
                  return;
                }
                setShowListingDeactivateConfirm(true);
              }}
              disabled={isDeactivatingListing}
              className="w-full py-2 bg-neutral-900 text-white rounded-xl shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Deactivate listing
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/60">
            <h2 className="text-lg font-bold text-black">Account Suspension Tool</h2>
            <p className="text-sm text-neutral-600">
              Suspend a user account by providing their username or user ID. Suspended users will see a suspension label on their profile.
            </p>
            <input
              type="text"
              placeholder="Enter username or userId"
              value={moderSuspendUserId}
              onChange={(event) => setModerSuspendUserId(event.target.value)}
              className="w-full p-2 border rounded-xl"
            />
            <button
              onClick={() => {
                if (!moderSuspendUserId.trim()) {
                  toast.error('Please provide a username or user ID.');
                  return;
                }
                setShowSuspendConfirmPopup(true);
              }}
              disabled={isSuspendingUser}
              className="w-full py-2 bg-neutral-900 text-white rounded-xl shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Suspend account
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-6 lg:col-span-4">
        {/* <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/60">
          <h2 className="text-lg font-semibold mb-4">Withdraw for Promoter</h2>
          <input
            type="text"
            placeholder="Enter Promoter userId"
            value={promoterUserId}
            onChange={(e) => setPromoterUserId(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
          />
          <button
            onClick={() => {
              if (!promoterUserId.trim()) {
                toast.error('Please provide a promoter userId.');
                return;
              }
              setShowPromoterWithdrawConfirm(true);
            }}
            disabled={isLoading}
            className="mt-3 w-full rounded-xl bg-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Withdraw
          </button>
        </div> */}

         <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/60">
            <h2 className="text-lg font-semibold mb-4">Payout for Promoter</h2>
            <input
              type="text"
              placeholder="Enter Promoter username or userId"
              value={promoterUserId}
              onChange={(e) => setPromoterUserId(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
            />
            <input
              type="number"
              min="0"
              placeholder="Amount"
              value={promoterPayoutAmount}
              onChange={(e) => setPromoterPayoutAmount(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
            />
            <textarea
              placeholder="Add payout note (optional)"
              value={promoterPayoutNote}
              onChange={(e) => setPromoterPayoutNote(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
            />
            <label className="mt-2 block text-sm font-semibold text-neutral-700">
              Attachment (optional)
              <input
                type="file"
                accept=".pdf,application/pdf,image/*"
                onChange={(event) => handleAttachmentUpload(event, setPromoterAttachment)}
                className="mt-1 w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
              />
              {promoterAttachment?.name && (
                <p className="mt-1 text-xs text-neutral-500">Selected: {promoterAttachment.name}</p>
              )}
            </label>
            <button
              onClick={() => {
                if (!promoterUserId.trim() || !promoterPayoutAmount.trim()) {
                  toast.error('Please provide a promoter username/userId and amount.');
                  return;
                }
                setShowPromoterPayoutConfirm(true);
              }}
              disabled={isLoading}
              className="mt-3 w-full rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send payout
            </button>
          </div>

        {/* <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/60">
          <h2 className="text-lg font-semibold mb-4">Withdraw for Host</h2>
          <input
            type="text"
            placeholder="Enter Host userId"
            value={hostUserId}
            onChange={(e) => setHostUserId(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
          />
          <button
            onClick={() => {
              if (!hostUserId.trim()) {
                toast.error('Please provide a host userId.');
                return;
              }
              setShowHostWithdrawConfirm(true);
            }}
            disabled={isLoading}
            className="mt-3 w-full rounded-xl bg-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Withdraw
          </button>
        </div> */}

        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/60">
          <h2 className="text-lg font-semibold mb-4">Payout for Host</h2>
          <input
            type="text"
            placeholder="Enter Host username or userId"
            value={hostUserId}
            onChange={(e) => setHostUserId(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
          />
          <input
            type="number"
            min="0"
            placeholder="Amount"
            value={hostPayoutAmount}
            onChange={(e) => setHostPayoutAmount(e.target.value)}
            className="mt-2 w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
          />
          <textarea
            placeholder="Add payout note (optional)"
            value={hostPayoutNote}
            onChange={(e) => setHostPayoutNote(e.target.value)}
            className="mt-2 w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
          />
          <label className="mt-2 block text-sm font-semibold text-neutral-700">
            Attachment (optional)
            <input
              type="file"
              accept=".pdf,application/pdf,image/*"
              onChange={(event) => handleAttachmentUpload(event, setHostAttachment)}
              className="mt-1 w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
            />
            {hostAttachment?.name && <p className="mt-1 text-xs text-neutral-500">Selected: {hostAttachment.name}</p>}
          </label>
          <button
            onClick={() => {
              if (!hostUserId.trim() || !hostPayoutAmount.trim()) {
                toast.error('Please provide a host username/userId and amount.');
                return;
              }
              setShowHostPayoutConfirm(true);
            }}
            disabled={isLoading}
            className="mt-3 w-full rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send payout
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/60">
          <h3 className="text-lg font-semibold mb-4">Moderator Cancellation Tool</h3>
          <input
            type="text"
            placeholder="Enter Reservation ID"
            value={selectedReservationId}
            onChange={(e) => setSelectedReservationId(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
          />
          <textarea
            placeholder="Add a note for the user (required)"
            value={cancellationNote}
            onChange={(e) => setCancellationNote(e.target.value)}
            className="mt-3 w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
            rows={3}
          />
          <label className="mt-3 block text-sm font-semibold text-neutral-700">
            Attachment (optional)
            <input
              type="file"
              accept=".pdf,application/pdf,image/*"
              onChange={(event) => handleAttachmentUpload(event, setCancellationAttachment)}
              className="mt-1 w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
            />
            {cancellationAttachment?.name && (
              <p className="mt-1 text-xs text-neutral-500">Selected: {cancellationAttachment.name}</p>
            )}
          </label>
          <button
            onClick={() => {
              if (!selectedReservationId.trim()) {
                toast.error('Please provide a reservation ID.');
                return;
              }
              if (!cancellationNote.trim()) {
                toast.error('Please provide a cancellation note.');
                return;
              }
              setConfirmAction(() => () => onCancel(selectedReservationId));
              setShowConfirmPopup(true);
            }}
            className="mt-3 w-full rounded-xl bg-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-100"
          >
            Cancel Reservation
          </button>
        </div>

        {/* Host Lookup */}
        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/60">
          <h3 className="text-lg font-semibold mb-4">Get Full Reservation Data</h3>
          <p className="text-sm text-neutral-600">Lookup any reservation and inspect its stored details.</p>
          <input
            type="text"
            placeholder="Enter reservationId"
            value={reservationLookupId}
            onChange={(event) => setReservationLookupId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
          />
          <button
            onClick={handleFetchReservationDetails}
            disabled={isFetchingReservation}
            className="mt-3 w-full rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetchingReservation ? 'Fetching…' : 'Fetch Reservation'}
          </button>
          <div className="mt-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <input
                type="text"
                placeholder="Lookup by username"
                value={reservationLookupUsername}
                onChange={(event) => setReservationLookupUsername(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
              />
              <button
                type="button"
                onClick={handleFetchReservationsByUsername}
                disabled={isFetchingReservation}
                className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetchingReservation ? 'Searching…' : 'Fetch'}
              </button>
            </div>
            {reservationDetails.length > 0 && (
              reservationDetails.length > 1 ? (
                <Slider {...DETAIL_SLIDER_SETTINGS} className="mt-1">
                  {reservationDetails.map((detail, index) => (
                    <div key={`reservation-${detail.id ?? index}`} className="px-1">
                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-xs text-neutral-800">
                        {formatJson(detail)}
                      </pre>
                    </div>
                  ))}
                </Slider>
              ) : (
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-xs text-neutral-800">
                  {formatJson(reservationDetails[0])}
                </pre>
              )
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/60">
          <h3 className="text-lg font-semibold mb-4">Get Full Listing Data</h3>
          <p className="text-sm text-neutral-600">Fetch the latest listing payload, including its host details.</p>
          <input
            type="text"
            placeholder="Enter listingId"
            value={listingLookupId}
            onChange={(event) => setListingLookupId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
          />
          <button
            onClick={handleFetchListingDetails}
            disabled={isFetchingListing}
            className="mt-3 w-full rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetchingListing ? 'Fetching…' : 'Fetch Listing'}
          </button>
          <div className="mt-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <input
                type="text"
                placeholder="Lookup listings by username"
                value={listingLookupUsername}
                onChange={(event) => setListingLookupUsername(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 p-2 text-sm text-neutral-700"
              />
              <button
                type="button"
                onClick={handleFetchListingsByUsername}
                disabled={isFetchingListing}
                className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetchingListing ? 'Searching…' : 'Fetch'}
              </button>
            </div>
            {listingDetails.length > 0 && (
              listingDetails.length > 1 ? (
                <Slider {...DETAIL_SLIDER_SETTINGS} className="mt-1">
                  {listingDetails.map((detail, index) => (
                    <div key={`listing-${detail.id ?? index}`} className="px-1">
                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-xs text-neutral-800">
                        {formatJson(detail)}
                      </pre>
                    </div>
                  ))}
                </Slider>
              ) : (
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-xs text-neutral-800">
                  {formatJson(listingDetails[0])}
                </pre>
              )
            )}
          </div>
        </div>

      {/* User Lookup */}
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-black">User Analytics Lookup</h2>
        <input
          type="text"
          placeholder="Enter username, userId, or email"
          value={userLookup}
          onChange={(e) => setUserLookup(e.target.value)}
          className="w-full p-2 border rounded-xl"
        />
        <button
          onClick={handleUserAnalytics}
          className="w-full py-2 bg-neutral-200 text-black rounded-xl hover:bg-neutral-100 transition"
        >
          Fetch User Data
        </button>

        {userAnalytics && (
          <div className="text-sm text-neutral-700 space-y-1">
            
            <p><strong>User ID:</strong> {userAnalytics.userId}</p>
            {userAnalytics.username && <p><strong>Username:</strong> {userAnalytics.username}</p>}
            {userAnalytics.userEmail && <p><strong>Email:</strong> {userAnalytics.userEmail}</p>}
            {userAnalytics.referenceId && <p><strong>Reference ID:</strong> {userAnalytics.referenceId}</p>}
            {userAnalytics.userRole && <p><strong>Role:</strong> {userAnalytics.userRole}</p>}
            <p><strong>Total Bookings:</strong> {userAnalytics.totalBooks}</p>
            <p><strong>Total Revenue:</strong> {formatConverted(userAnalytics.totalRevenue)}</p>
            <p><strong>Payout Method:</strong> {userAnalytics.payoutMethod.toUpperCase()}</p>
            <p><strong>Payout Number:</strong> {userAnalytics.payoutNumber}</p>
            <p><strong>Partner Commission:</strong> {Math.round(userAnalytics.partnerCommission ?? MIN_PARTNER_COMMISSION)}%</p>
            <p>
              <strong>VinVin Score:</strong> {Math.round(userAnalytics.punti ?? 0)} / {MAX_PARTNER_POINT_VALUE}
              {userAnalytics.puntiLabel ? ` (${userAnalytics.puntiLabel})` : ''}
            </p>
            <p>
              <strong>Relevance:</strong> {formatPuntiPercentage(userAnalytics.puntiShare ?? 0)}
            </p>
            {typeof userAnalytics.platformRelevance === 'number' && (
              <p><strong>Platform Relevance:</strong> {formatPuntiPercentage(userAnalytics.platformRelevance)}</p>
            )}
            {userAnalytics.breakdown && (
              <div className="space-y-1">
                <p className="font-semibold">Breakdown</p>
                <p>Daily entries: {userAnalytics.breakdown.daily?.length ?? 0}</p>
                <p>Monthly entries: {userAnalytics.breakdown.monthly?.length ?? 0}</p>
                <p>Yearly entries: {userAnalytics.breakdown.yearly?.length ?? 0}</p>
              </div>
            )}
            {userAnalytics.currency && (
              <p><strong>Currency:</strong> {userAnalytics.currency}</p>
            )}
            {userRecord && (
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-xs text-neutral-800">
                {formatJson(userRecord)}
              </pre>
            )}
          </div>
        )}
      </div>


      </aside>
    </div>

    {/* Promoter Lookup */}
    {/* <div className="grid px-5 md:px-60 gap-10 mt-10  pt-16">
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
          <h2 className="text-lg font-bold text-black">Adjust Listing Punti</h2>
          <p className="text-sm text-neutral-600">
            Add punti to a listing without changing host commission. Additions are capped at {MAX_PARTNER_POINT_VALUE}{' '}
            punti per listing.
          </p>
          <input
            type="text"
            placeholder="Enter listingId"
            value={puntiUpdate.listingId}
            onChange={(event) => {
              setPuntiUpdate((prev) => ({ ...prev, listingId: event.target.value }));
              setCurrentListingPunti(null);
              setPuntiResult(null);
            }}
            className="w-full p-2 border rounded-xl"
          />

          <div className="text-xs text-neutral-600 space-y-1">
            <p>
              Current punti: {currentListingPunti === null ? '— (fetched on add)' : `${currentListingPunti} / ${MAX_PARTNER_POINT_VALUE}`}
            </p>
            <p>Available to add now: {availablePuntiToAdd}</p>
          </div>

          <div className="space-y-3">
            <input
              type="number"
              min={0}
              max={availablePuntiToAdd || MAX_PARTNER_POINT_VALUE}
              value={puntiUpdate.punti}
              onChange={(event) => setPuntiUpdate((prev) => ({ ...prev, punti: event.target.value }))}
              className="w-full p-2 border rounded-xl"
              placeholder={`0 - ${MAX_PARTNER_POINT_VALUE}`}
            />
            <input
              type="range"
              min={0}
              max={MAX_PARTNER_POINT_VALUE}
              value={safePuntiPreview}
              onChange={(event) =>
                setPuntiUpdate((prev) => ({ ...prev, punti: event.target.value }))
              }
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
            <span>Pending add: {safePuntiPreview} punti</span>
            <span>Listing cap: {MAX_PARTNER_POINT_VALUE} punti</span>
          </div>
          {puntiResult && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              <p>Added {puntiResult.added} punti.</p>
              <p>Listing total: {puntiResult.total} / {MAX_PARTNER_POINT_VALUE}.</p>
            </div>
          )}
          <button
            onClick={handlePuntiUpdate}
            disabled={isUpdatingPunti}
            className="w-full py-2 bg-neutral-900 text-white rounded-xl shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUpdatingPunti ? 'Adding…' : 'Add punti'}
          </button>
        </div>
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 px-5 md:px-60 gap-10 mt-10  pt-16">

      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-black">Moderator Listing Deactivation</h2>
        <p className="text-sm text-neutral-600">
          Deactivate a listing immediately by providing its listing ID. The listing status will be set to inactive.
        </p>
        <input
          type="text"
          placeholder="Enter listingId"
          value={moderListingId}
          onChange={(event) => setModerListingId(event.target.value)}
          className="w-full p-2 border rounded-xl"
        />
        <button
          onClick={() => {
            if (!moderListingId.trim()) {
              toast.error('Please provide a listing ID.');
              return;
            }
            setShowListingDeactivateConfirm(true);
          }}
          disabled={isDeactivatingListing}
          className="w-full py-2 bg-neutral-900 text-white rounded-xl shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          Deactivate listing
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-black">Account Suspension Tool</h2>
        <p className="text-sm text-neutral-600">
          Suspend a user account by providing their username or user ID. Suspended users will see a suspension label on their
          profile.
        </p>
        <input
          type="text"
          placeholder="Enter username or userId"
          value={moderSuspendUserId}
          onChange={(event) => setModerSuspendUserId(event.target.value)}
          className="w-full p-2 border rounded-xl"
        />
        <button
          onClick={() => {
                if (!moderSuspendUserId.trim()) {
                  toast.error('Please provide a username or user ID.');
                  return;
                }
                setShowSuspendConfirmPopup(true);
            }}
          disabled={isSuspendingUser}
          className="w-full py-2 bg-neutral-900 text-white rounded-xl shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          Suspend account
        </button>
      </div>
    </div> */}

    {showConfirmPopup && (
      <ConfirmPopup
        title="Confirm Action"
        message="Are you sure you want to proceed?"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={() => {
          confirmAction();
          setShowConfirmPopup(false);
        }}
        onCancel={() => setShowConfirmPopup(false)}
      />
    )}

    {showListingDeactivateConfirm && (
      <ConfirmPopup
        title="Deactivate listing"
        message="Are you sure you want to deactivate this listing?"
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        onConfirm={handleModeratorDeactivate}
        onCancel={() => setShowListingDeactivateConfirm(false)}
      />
    )}

    {showSuspendConfirmPopup && (
      <ConfirmPopup
        title="Suspend account"
        message="Are you sure you want to suspend this account?"
        confirmLabel="Suspend"
        cancelLabel="Cancel"
        onConfirm={handleSuspendAccount}
        onCancel={() => setShowSuspendConfirmPopup(false)}
      />
    )}

    {showPromoterWithdrawConfirm && (
      <ConfirmPopup
        title="Confirm Withdrawal"
        message="Are you sure you want to withdraw for this promoter?"
        onConfirm={() => handleWithdraw(promoterUserId)}
        onCancel={() => setShowPromoterWithdrawConfirm(false)}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />
    )}

    {showPromoterPayoutConfirm && (
      <ConfirmPopup
        title="Confirm payout"
        message="Are you sure you want to send this payout to the promoter?"
        onConfirm={() => {
          handlePayoutPromoter();
          setShowPromoterPayoutConfirm(false);
        }}
        onCancel={() => setShowPromoterPayoutConfirm(false)}
        confirmLabel="Send"
        cancelLabel="Cancel"
      />
    )}

    {showHostWithdrawConfirm && (
      <ConfirmPopup
        title="Confirm Withdrawal"
        message="Are you sure you want to withdraw for this host?"
        onConfirm={() => handleWithdrawForHosts(hostUserId)}
        onCancel={() => setShowHostWithdrawConfirm(false)}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />
    )}

    {showHostPayoutConfirm && (
      <ConfirmPopup
        title="Confirm payout"
        message="Are you sure you want to send this payout to the host?"
        onConfirm={() => {
          handlePayoutHost();
          setShowHostPayoutConfirm(false);
        }}
        onCancel={() => setShowHostPayoutConfirm(false)}
        confirmLabel="Send"
        cancelLabel="Cancel"
      />
    )}

    <Lightbox
      open={lightboxOpen}
      close={closeLightbox}
      slides={lightboxSlides}
      index={lightboxIndex}
      controller={{ closeOnBackdropClick: true }}
    />
    </>
  );
};

export default ModerationClient;