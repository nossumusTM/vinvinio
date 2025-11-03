import type { Listing, User } from "@prisma/client";

import type { SafeListing, SafeUser } from "@/app/types";
import { normalizePricingSnapshot } from "./pricing";

export const toSafeUser = (user: User): SafeUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image,
  role: user.role,
  referenceId: user.referenceId ?? null,
  favoriteIds: Array.isArray(user.favoriteIds) ? [...user.favoriteIds] : [],
  phone: user.phone ?? null,
  contact: user.contact ?? null,
  legalName: user.legalName ?? null,
  address: user.address ?? null,
  hostName: user.hostName ?? null,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
  emailVerified: user.emailVerified?.toISOString() ?? null,
});

type ListingWithUser = Listing & { user: User };

export const toSafeListing = (listing: ListingWithUser): SafeListing => {
  const pricingSnapshot = normalizePricingSnapshot(
    listing.customPricing,
    Number(listing.price ?? 0),
  );

  const normalizedBasePrice =
    pricingSnapshot.basePrice > 0
      ? pricingSnapshot.basePrice
      : Number(listing.price ?? 0);

  const normalizedGroupPrice =
    pricingSnapshot.groupPrice ??
    (typeof listing.groupPrice === "number" ? listing.groupPrice : null);

  const normalizedGroupSize =
    pricingSnapshot.groupSize ??
    (typeof listing.groupSize === "number" ? listing.groupSize : null);

  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    hostDescription: listing.hostDescription ?? null,
    imageSrc: Array.isArray(listing.imageSrc) ? [...listing.imageSrc] : [],
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    category: Array.isArray(listing.category) ? [...listing.category] : [],
    roomCount: listing.roomCount,
    bathroomCount: listing.bathroomCount,
    guestCount: listing.guestCount,
    experienceHour: listing.experienceHour ?? null,
    meetingPoint: listing.meetingPoint ?? null,
    languages: Array.isArray(listing.languages) ? [...listing.languages] : [],
    locationValue: listing.locationValue,
    locationType: Array.isArray(listing.locationType)
      ? [...listing.locationType]
      : [],
    locationDescription: listing.locationDescription ?? null,
    groupStyles: Array.isArray(listing.groupStyles) ? [...listing.groupStyles] : [],
    durationCategory: listing.durationCategory ?? null,
    environments: Array.isArray(listing.environments)
      ? [...listing.environments]
      : [],
    activityForms: Array.isArray(listing.activityForms)
      ? [...listing.activityForms]
      : [],
    seoKeywords: Array.isArray(listing.seoKeywords) ? [...listing.seoKeywords] : [],
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
    user: toSafeUser(listing.user),
    slug: listing.slug ?? null,
    primaryCategory: listing.primaryCategory ?? null,
  };
};

