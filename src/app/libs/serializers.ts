import type { Listing, User } from "@prisma/client";

import type { SafeListing, SafeUser } from "@/app/types";
import { normalizePricingSnapshot } from "./pricing";

type SupportedUserShape =
  | (Partial<SafeUser> & Pick<SafeUser, "id" | "role">)
  | (Partial<User> & Pick<User, "id" | "role">)
  | null
  | undefined;

const toIsoString = (value: unknown, fallback: string): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return fallback;
};

const normalizeArray = <T>(value: unknown, coerce: (entry: unknown) => T | null): T[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => coerce(entry))
    .filter((entry): entry is T => entry !== null);
};

const DEFAULT_DATE = new Date(0).toISOString();

export const toSafeUser = (user: SupportedUserShape): SafeUser => {
  if (!user) {
    return {
      id: "unknown-user",
      name: null,
      email: null,
      image: null,
      role: "customer",
      referenceId: null,
      favoriteIds: [],
      phone: null,
      contact: null,
      legalName: null,
      address: null,
      hostName: null,
      createdAt: DEFAULT_DATE,
      updatedAt: DEFAULT_DATE,
      emailVerified: null,
    };
  }

  const favoriteIds = normalizeArray<string>(
    (user as User)?.favoriteIds ?? (user as SafeUser)?.favoriteIds,
    (entry) => (typeof entry === "string" ? entry : null),
  );

  return {
    id: user.id,
    name: "name" in user ? (user.name ?? null) : null,
    email: "email" in user ? (user.email ?? null) : null,
    image: "image" in user ? (user.image ?? null) : null,
    role: user.role,
    referenceId: "referenceId" in user ? user.referenceId ?? null : null,
    favoriteIds,
    phone: "phone" in user ? user.phone ?? null : null,
    contact: "contact" in user ? user.contact ?? null : null,
    legalName: "legalName" in user ? user.legalName ?? null : null,
    address: "address" in user ? user.address ?? null : null,
    hostName: "hostName" in user ? user.hostName ?? null : null,
    createdAt: toIsoString("createdAt" in user ? user.createdAt : undefined, DEFAULT_DATE),
    updatedAt: toIsoString("updatedAt" in user ? user.updatedAt : undefined, DEFAULT_DATE),
    emailVerified: (() => {
      if ("emailVerified" in user) {
        const value = user.emailVerified;
        if (value instanceof Date) {
          return value.toISOString();
        }
        if (typeof value === "string") {
          const parsed = new Date(value);
          if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString();
          }
        }
      }
      return null;
    })(),
  };
};

type ListingWithRelations =
  | (Listing & {
      user?: SupportedUserShape;
      reviews?: { rating?: number | null }[] | null;
    })
  | SafeListing;

const ensureNumber = (value: unknown): number => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const toSafeListing = (listing: ListingWithRelations): SafeListing => {
  const pricingSnapshot = normalizePricingSnapshot(
    (listing as Listing).customPricing ?? (listing as SafeListing).customPricing,
    ensureNumber((listing as Listing).price ?? (listing as SafeListing).price ?? 0),
  );

  const normalizedBasePrice =
    pricingSnapshot.basePrice > 0
      ? pricingSnapshot.basePrice
      : ensureNumber((listing as Listing).price ?? (listing as SafeListing).price ?? 0);

  const normalizedGroupPrice =
    pricingSnapshot.groupPrice ??
    (typeof (listing as Listing).groupPrice === "number"
      ? (listing as Listing).groupPrice
      : typeof (listing as SafeListing).groupPrice === "number"
        ? (listing as SafeListing).groupPrice
        : null);

  const normalizedGroupSize =
    pricingSnapshot.groupSize ??
    (typeof (listing as Listing).groupSize === "number"
      ? (listing as Listing).groupSize
      : typeof (listing as SafeListing).groupSize === "number"
        ? (listing as SafeListing).groupSize
        : null);

  const normalizeStringList = (value: unknown): string[] =>
    normalizeArray<string>(value, (entry) =>
      typeof entry === "string" && entry.trim().length > 0 ? entry : null,
    );

  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    hostDescription:
      "hostDescription" in listing && listing.hostDescription !== undefined
        ? listing.hostDescription ?? null
        : null,
    imageSrc: normalizeStringList((listing as Listing).imageSrc ?? (listing as SafeListing).imageSrc),
    createdAt: toIsoString(listing.createdAt, DEFAULT_DATE),
    updatedAt: toIsoString(
      "updatedAt" in listing ? listing.updatedAt : undefined,
      DEFAULT_DATE,
    ),
    category: normalizeStringList((listing as Listing).category ?? (listing as SafeListing).category),
    roomCount: ensureNumber(listing.roomCount),
    bathroomCount: ensureNumber(listing.bathroomCount),
    guestCount: ensureNumber(listing.guestCount),
    experienceHour:
      "experienceHour" in listing && listing.experienceHour !== undefined
        ? (typeof listing.experienceHour === "number"
            ? listing.experienceHour
            : Number(listing.experienceHour ?? 0)) || null
        : null,
    meetingPoint:
      "meetingPoint" in listing && typeof listing.meetingPoint === "string"
        ? listing.meetingPoint
        : null,
    languages: normalizeStringList((listing as Listing).languages ?? (listing as SafeListing).languages),
    locationValue: listing.locationValue ?? "",
    locationType: normalizeStringList(
      (listing as Listing).locationType ?? (listing as SafeListing).locationType,
    ),
    locationDescription:
      "locationDescription" in listing && typeof listing.locationDescription === "string"
        ? listing.locationDescription
        : null,
    groupStyles: normalizeStringList(
      (listing as Listing).groupStyles ?? (listing as SafeListing).groupStyles,
    ),
    durationCategory:
      "durationCategory" in listing && typeof listing.durationCategory === "string"
        ? listing.durationCategory
        : null,
    environments: normalizeStringList(
      (listing as Listing).environments ?? (listing as SafeListing).environments,
    ),
    activityForms: normalizeStringList(
      (listing as Listing).activityForms ?? (listing as SafeListing).activityForms,
    ),
    seoKeywords: normalizeStringList(
      (listing as Listing).seoKeywords ?? (listing as SafeListing).seoKeywords,
    ),
    userId: listing.userId,
    status: listing.status,
    price: normalizedBasePrice,
    pricingType: pricingSnapshot.mode ?? listing.pricingType ?? null,
    groupPrice: normalizedGroupPrice,
    groupSize: normalizedGroupSize,
    customPricing:
      pricingSnapshot.tiers.length > 0
        ? pricingSnapshot.tiers.map((tier) => ({ ...tier }))
        : null,
    user: toSafeUser((listing as ListingWithRelations).user),
    slug: "slug" in listing ? listing.slug ?? null : null,
    primaryCategory:
      "primaryCategory" in listing && typeof listing.primaryCategory === "string"
        ? listing.primaryCategory
        : null,
  } as SafeListing;
};

