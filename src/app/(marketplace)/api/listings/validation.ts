import { PRICING_MODES_SET, PricingMode } from '../../libs/pricing';
import { normalizeAvailabilityRules } from '../../utils/timeSlots';

export type ListingStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision'
  | 'inactive'
  | 'awaiting_reapproval';

export class ListingValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ListingValidationError';
    this.status = status;
  }
}

type StringLike = string | { value?: string; label?: string } | null | undefined;

const toTrimmedString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value && typeof value === 'object') {
    const candidate = (value as { value?: string; label?: string }).value ?? (value as { value?: string; label?: string }).label;
    return typeof candidate === 'string' ? candidate.trim() : '';
  }

  return '';
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const deduped = new Set<string>();

  value.forEach((entry) => {
    const normalized = toTrimmedString(entry);
    if (normalized) {
      deduped.add(normalized);
    }
  });

  return Array.from(deduped);
};

const normalizeCategory = (category: unknown): string[] => {
  const values = Array.isArray(category) ? category : [category];
  const normalized = values
    .map((item) => toTrimmedString(item as StringLike))
    .filter((item): item is string => item.length > 0);

  if (normalized.length === 0) {
    throw new ListingValidationError('At least one category is required');
  }

  return normalized;
};

const normalizePricingMode = (pricingType: unknown): PricingMode => {
  const candidate = typeof pricingType === 'string' ? pricingType : '';
  return PRICING_MODES_SET.has(candidate as PricingMode) ? (candidate as PricingMode) : 'fixed';
};

const normalizeBasePrice = (price: unknown): number => {
  const parsed = Math.round(Number(price));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ListingValidationError('Price must be a positive number');
  }

  return parsed;
};

const normalizeGroupPrice = (price: unknown): number | null => {
  if (price === null || price === undefined || price === '') {
    return null;
  }

  const parsed = Math.round(Number(price));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeGroupSize = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Math.round(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeCustomPricing = (pricingType: PricingMode, customPricing: unknown) => {
  if (!Array.isArray(customPricing)) {
    return [];
  }

  const tiers = customPricing
    .map((tier) => ({
      minGuests: Number((tier as any)?.minGuests ?? 0),
      maxGuests: Number((tier as any)?.maxGuests ?? 0),
      price: Number((tier as any)?.price ?? 0),
    }))
    .filter((tier) => Number.isFinite(tier.minGuests) && Number.isFinite(tier.maxGuests) && Number.isFinite(tier.price))
    .filter((tier) => tier.minGuests > 0 && tier.maxGuests > 0 && tier.price > 0)
    .map((tier) => ({
      minGuests: Math.max(1, Math.round(tier.minGuests)),
      maxGuests: Math.max(Math.round(tier.maxGuests), Math.max(1, Math.round(tier.minGuests))),
      price: Math.max(1, Math.round(tier.price)),
    }))
    .sort((a, b) => a.minGuests - b.minGuests);

  if (pricingType === 'custom' && tiers.length === 0) {
    throw new ListingValidationError('Provide at least one valid custom pricing tier');
  }

  return pricingType === 'custom' ? tiers : [];
};

const normalizeLocationValue = (location: unknown): string => {
  if (typeof location === 'string') {
    const trimmed = location.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  if (location && typeof location === 'object') {
    const value = (location as { value?: string }).value;
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  throw new ListingValidationError('Invalid location information');
};

const normalizeImages = (imageSrc: unknown): string[] => {
  if (!Array.isArray(imageSrc)) {
    throw new ListingValidationError('At least one media file is required');
  }

  const sanitized = imageSrc
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item): item is string => item.length > 0);

  if (sanitized.length === 0) {
    throw new ListingValidationError('At least one media file is required');
  }

  return sanitized;
};

const normalizeGuestCount = (guestCount: unknown): number => {
  const parsed = Math.round(Number(guestCount ?? 1));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const normalizeExperienceHour = (experienceHour: unknown): number | null => {
  if (experienceHour === null || experienceHour === undefined || experienceHour === '') {
    return null;
  }

  if (typeof experienceHour === 'number') {
    return Number.isFinite(experienceHour) ? experienceHour : null;
  }

  if (typeof experienceHour === 'string') {
    const parsed = parseFloat(experienceHour);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof experienceHour === 'object') {
    const value = (experienceHour as { value?: string }).value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }

  return null;
};

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeHoursInAdvance = (value: unknown): number => {
  const parsed = Math.round(Number(value ?? 0));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
};

const SUBSCRIPTION_INTERVALS = new Set(['monthly', 'yearly']);

const normalizeVinSubscriptionEnabled = (value: unknown): boolean => {
  return Boolean(value);
};

const normalizeVinSubscriptionInterval = (value: unknown): 'monthly' | 'yearly' | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return SUBSCRIPTION_INTERVALS.has(normalized) ? (normalized as 'monthly' | 'yearly') : null;
};

const normalizeVinSubscriptionPrice = (value: unknown, enabled: boolean): number | null => {
  if (!enabled) {
    return null;
  }

  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ListingValidationError('Subscription price must be a positive number');
  }

  return parsed;
};

export interface ListingUpdatePayload {
  title?: unknown;
  description?: unknown;
  imageSrc?: unknown;
  category?: unknown;
  guestCount?: unknown;
  location?: unknown;
  price?: unknown;
  experienceHour?: unknown;
  hoursInAdvance?: unknown;
  hostDescription?: unknown;
  meetingPoint?: unknown;
  languages?: unknown;
  locationType?: unknown;
  locationDescription?: unknown;
  groupStyles?: unknown;
  durationCategory?: unknown;
  environments?: unknown;
  activityForms?: unknown;
  seoKeywords?: unknown;
  pricingType?: unknown;
  groupPrice?: unknown;
  groupSize?: unknown;
  customPricing?: unknown;
  availabilityRules?: unknown;
  vinSubscriptionEnabled?: unknown;
  vinSubscriptionInterval?: unknown;
  vinSubscriptionPrice?: unknown;
  vinSubscriptionTerms?: unknown;
  vinSubscriptionOptions?: unknown;
}

export interface NormalizedListingUpdate {
  data: {
    title: string;
    description: string;
    hostDescription: string | null;
    imageSrc: string[];
    category: string[];
    primaryCategory: string | null;
    guestCount: number;
    experienceHour: number | null;
    hoursInAdvance: number;
    meetingPoint: string | null;
    languages: { set: string[] };
    locationValue: string;
    price: number;
    customPricing: {
      mode: PricingMode;
      basePrice: number;
      groupPrice: number | null;
      groupSize: number | null;
      tiers: Array<{ minGuests: number; maxGuests: number; price: number }>;
    };
    locationType: { set: string[] };
    locationDescription: string | null;
    groupStyles: { set: string[] };
    durationCategory: string | null;
    environments: { set: string[] };
    activityForms: { set: string[] };
    seoKeywords: { set: string[] };
    availabilityRules: Record<string, unknown> | null;
    vinSubscriptionEnabled: boolean;
    vinSubscriptionInterval: 'monthly' | 'yearly' | null;
    vinSubscriptionPrice: number | null;
    vinSubscriptionTerms: string | null;
    vinSubscriptionOptions: Array<{
      id: string;
      label: string;
      description: string | null;
      price: number;
      interval: 'monthly' | 'yearly';
    }>;
  };
  pricingMode: PricingMode;
  groupPrice: number | null;
  groupSize: number | null;
  nextStatus: ListingStatus;
}

const normalizeVinSubscriptionTerms = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeVinSubscriptionOptions = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((option) => {
      const id = typeof option?.id === 'string' && option.id.trim().length > 0
        ? option.id.trim()
        : null;
      const label = typeof option?.label === 'string' ? option.label.trim() : '';
      const description = typeof option?.description === 'string'
        ? option.description.trim()
        : '';
      const price = Math.round(Number(option?.price ?? 0));
      const interval =
        typeof option?.interval === 'string' && ['monthly', 'yearly'].includes(option.interval)
          ? option.interval
          : null;

      if (!id || !label || !interval || !Number.isFinite(price) || price <= 0) {
        return null;
      }

      return {
        id,
        label,
        description: description.length > 0 ? description : null,
        price,
        interval,
      };
    })
    .filter(
      (
        option,
      ): option is {
        id: string;
        label: string;
        description: string | null;
        price: number;
        interval: 'monthly' | 'yearly';
      } => Boolean(option),
    );
};

export const normalizeListingUpdatePayload = (
  payload: ListingUpdatePayload,
  existingListing: { status: ListingStatus; primaryCategory: string | null },
): NormalizedListingUpdate => {
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const description = typeof payload.description === 'string' ? payload.description.trim() : '';

  if (!title) {
    throw new ListingValidationError('Title is required');
  }

  if (!description) {
    throw new ListingValidationError('Description is required');
  }

  const category = normalizeCategory(payload.category);
  const primaryCategory = category[0] ?? existingListing.primaryCategory ?? null;

  const pricingMode = normalizePricingMode(payload.pricingType);
  const basePrice = normalizeBasePrice(payload.price);
  const groupPrice = normalizeGroupPrice(payload.groupPrice);
  const groupSize = normalizeGroupSize(payload.groupSize);

  if (pricingMode === 'group' && (!groupPrice || !groupSize)) {
    throw new ListingValidationError('Group pricing requires a price and group size');
  }

  const tiers = normalizeCustomPricing(pricingMode, payload.customPricing);
  const locationValue = normalizeLocationValue(payload.location);
  const images = normalizeImages(payload.imageSrc);
  const guestCount = normalizeGuestCount(payload.guestCount);
  const experienceHour = normalizeExperienceHour(payload.experienceHour);
  const hoursInAdvance = normalizeHoursInAdvance(payload.hoursInAdvance);
  const meetingPoint = normalizeOptionalString(payload.meetingPoint);
  const locationDescription = normalizeOptionalString(payload.locationDescription);

  const languages = normalizeStringArray(payload.languages);
  const locationTypes = normalizeStringArray(payload.locationType);
  const groupStyles = normalizeStringArray(payload.groupStyles);
  const environments = normalizeStringArray(payload.environments);
  const activityForms = normalizeStringArray(payload.activityForms);
  const seoKeywords = normalizeStringArray(payload.seoKeywords);
  const availabilityRules = normalizeAvailabilityRules(payload.availabilityRules);
  const vinSubscriptionEnabled = normalizeVinSubscriptionEnabled(payload.vinSubscriptionEnabled);
  const vinSubscriptionInterval = normalizeVinSubscriptionInterval(payload.vinSubscriptionInterval);
  const vinSubscriptionPrice = normalizeVinSubscriptionPrice(payload.vinSubscriptionPrice, vinSubscriptionEnabled);

  const vinSubscriptionTerms = normalizeVinSubscriptionTerms(payload.vinSubscriptionTerms);
  const vinSubscriptionOptions = normalizeVinSubscriptionOptions(payload.vinSubscriptionOptions);

  const hasLegacySubscription = Boolean(vinSubscriptionInterval && vinSubscriptionPrice);
  const hasOptionSubscription = vinSubscriptionOptions.length > 0;

  if (vinSubscriptionEnabled && !hasLegacySubscription && !hasOptionSubscription) {
    throw new ListingValidationError('Add at least one VIN subscription option or provide an interval and price.');
  }

  const resolvedSubscriptionInterval =
    vinSubscriptionOptions[0]?.interval ?? vinSubscriptionInterval ?? null;
  const resolvedSubscriptionPrice =
    vinSubscriptionOptions[0]?.price ?? vinSubscriptionPrice ?? null;

  if (vinSubscriptionEnabled && (!resolvedSubscriptionInterval || !resolvedSubscriptionPrice)) {
    throw new ListingValidationError('Subscription interval and price are required when VIN subscription is enabled');
  }

  const pricingSnapshot = {
    mode: pricingMode,
    basePrice,
    groupPrice: pricingMode === 'group' ? groupPrice : null,
    groupSize: pricingMode === 'group' ? groupSize : null,
    tiers,
  };

  const nextStatus =
    existingListing.status === 'approved' || existingListing.status === 'inactive'
      ? 'revision'
      : 'pending';

  return {
    data: {
      title,
      description,
      hostDescription: normalizeOptionalString(payload.hostDescription),
      imageSrc: images,
      category,
      primaryCategory,
      guestCount,
      experienceHour,
      hoursInAdvance,
      meetingPoint,
      languages: { set: languages },
      locationValue,
      price: basePrice,
      customPricing: pricingSnapshot,
      locationType: { set: locationTypes },
      locationDescription,
      groupStyles: { set: groupStyles },
      durationCategory: normalizeOptionalString(payload.durationCategory),
      environments: { set: environments },
      activityForms: { set: activityForms },
      seoKeywords: { set: seoKeywords },
      availabilityRules: availabilityRules ? { ...availabilityRules } : null,
      vinSubscriptionEnabled,
      vinSubscriptionInterval: resolvedSubscriptionInterval,
      vinSubscriptionPrice: resolvedSubscriptionPrice,
      vinSubscriptionTerms,
      vinSubscriptionOptions,
    },
    pricingMode,
    groupPrice: pricingSnapshot.groupPrice,
    groupSize: pricingSnapshot.groupSize,
    nextStatus,
  };
};
