import prisma from "@/app/(marketplace)/libs/prismadb";
import { ensureListingSlug } from "@/app/(marketplace)/libs/ensureListingSlug";
import { normalizePricingSnapshot } from "@/app/(marketplace)/libs/pricing";
import { findUserIdByHandle } from "@/app/(marketplace)/libs/userHandles";
import { SafeListing, SafeUser } from "@/app/(marketplace)/types";
import { ListingStatus, Role } from "@prisma/client";

export const dynamic = 'force-dynamic';

export interface HostCardReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  listingId: string;
  listingTitle: string;
  reviewerName: string;
  reviewerImage?: string | null;
}

export interface HostCardData {
  host: SafeUser;
  listings: SafeListing[];
  reviews: HostCardReview[];
}

export default async function getHostCardData(identifier: string): Promise<HostCardData | null> {
  if (!identifier) return null;

  let candidate = identifier;
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    // ignore decode issues and continue with the original candidate
  }

  const hostId = await findUserIdByHandle(candidate, { role: Role.host });
  if (!hostId) {
    return null;
  }

  const host = await prisma.user.findUnique({
    where: { id: hostId },
    include: {
      listings: {
        where: { status: ListingStatus.approved },
        include: {
          reviews: {
            include: {
              user: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!host || host.role !== Role.host) {
    return null;
  }

  const safeHost: SafeUser = {
    id: host.id,
    username: host.username ?? null,
    name: host.name ?? null,
    email: host.email ?? null,
    hostName: host.hostName ?? null,
    image: host.image ?? null,
    role: host.role,
    referenceId: host.referenceId ?? null,
    favoriteIds: Array.isArray(host.favoriteIds) ? host.favoriteIds : [],
    phone: host.phone ?? null,
    contact: host.contact ?? null,
    legalName: host.legalName ?? null,
    address: host.address ?? null,
    createdAt: host.createdAt.toISOString(),
    updatedAt: host.updatedAt?.toISOString() ?? host.createdAt.toISOString(),
    emailVerified: host.emailVerified?.toISOString() ?? null,
    bio: host.bio ?? null,
    visitedCountries: Array.isArray(host.visitedCountries) ? host.visitedCountries : [],
    visitedCities: Array.isArray(host.visitedCities) ? host.visitedCities : [],
    profession: host.profession ?? null,
    hobbies: Array.isArray(host.hobbies) ? host.hobbies : [],
    preferredContacts: Array.isArray(host.preferredContacts) ? host.preferredContacts : [],
    identityVerified: typeof host.identityVerified === "boolean" ? host.identityVerified : false,
  };

  const listingsWithSlug = await Promise.all(
    host.listings.map(async (listing) => {
      const enhanced = await ensureListingSlug(listing);
      return enhanced;
    })
  );

  const listings: SafeListing[] = listingsWithSlug.map((listing) => {
    const pricingSnapshot = normalizePricingSnapshot(listing.customPricing, listing.price);

    const { reviews: _reviews, ...rest } = listing;

    const safeListing: SafeListing = {
      ...(rest as unknown as SafeListing),
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt?.toISOString() ?? listing.createdAt.toISOString(),
      price: pricingSnapshot.basePrice > 0 ? pricingSnapshot.basePrice : listing.price,
      pricingType: pricingSnapshot.mode ?? null,
      groupPrice: pricingSnapshot.groupPrice,
      groupSize: pricingSnapshot.groupSize,
      customPricing: pricingSnapshot.tiers.length > 0 ? pricingSnapshot.tiers.map((tier) => ({ ...tier })) : null,
      imageSrc: Array.isArray(listing.imageSrc) ? [...listing.imageSrc] : [],
      languages: Array.isArray(listing.languages) ? [...listing.languages] : [],
      locationType: Array.isArray(listing.locationType) ? [...listing.locationType] : [],
      groupStyles: Array.isArray(listing.groupStyles) ? [...listing.groupStyles] : [],
      environments: Array.isArray(listing.environments) ? [...listing.environments] : [],
      activityForms: Array.isArray(listing.activityForms) ? [...listing.activityForms] : [],
      seoKeywords: Array.isArray(listing.seoKeywords) ? [...listing.seoKeywords] : [],
      user: safeHost,
    };

    return safeListing;
  });

  const reviews: HostCardReview[] = listingsWithSlug.flatMap((listing) => {
    return listing.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      listingId: listing.id,
      listingTitle: listing.title,
      reviewerName: review.userName ?? review.user?.name ?? "Guest",
      reviewerImage: review.user?.image ?? null,
    }));
  });

  return {
    host: safeHost,
    listings,
    reviews,
  };
}

