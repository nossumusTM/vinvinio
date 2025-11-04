import prisma from "@/app/libs/prismadb";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";
import { normalizePricingSnapshot } from "@/app/libs/pricing";
import { buildListingsWhereClause } from "./listingFilters";
import type { IListingsParams } from "./listings.types";
export type { IListingsParams } from "./listings.types";
export const dynamic = 'force-dynamic';

export default async function getListings(params: IListingsParams) {
  try {
    const { sort } = params;

    const query = buildListingsWhereClause(params);

    const listings = await prisma.listing.findMany({
      where: query,
      // orderBy: {
      //   createdAt: "desc",
      // },
      include: {
        user: true,
        reviews: true, // include related reviews
      },
      skip: params.skip ?? 0,
      take: params.take ?? 12,
    });

    const listingsWithSlug = await Promise.all(
      listings.map((listing) => ensureListingSlug(listing))
    );

    const safeListings = listingsWithSlug.map((listing) => {
      const totalRating = listing.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      const avgRating = listing.reviews.length > 0 ? totalRating / listing.reviews.length : 0;

      const pricingSnapshot = normalizePricingSnapshot(listing.customPricing, listing.price);

      return {
        ...listing,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
        avgRating,
        price: pricingSnapshot.basePrice > 0 ? pricingSnapshot.basePrice : listing.price,
        pricingType: pricingSnapshot.mode ?? null,
        groupPrice: pricingSnapshot.groupPrice,
        groupSize: pricingSnapshot.groupSize,
        customPricing: pricingSnapshot.tiers.length > 0 ? pricingSnapshot.tiers : null,
        user: {
          ...listing.user,
          createdAt: listing.user.createdAt.toISOString(),
          updatedAt: listing.user.updatedAt.toISOString(),
          emailVerified: listing.user.emailVerified?.toISOString() || null,
        },
      };
    });

    if (sort === 'rating') {
      safeListings.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (sort === 'priceLow') {
      safeListings.sort((a, b) => a.price - b.price);
    } else if (sort === 'priceHigh') {
      safeListings.sort((a, b) => b.price - a.price);
    } else {
      safeListings.sort(() => Math.random() - 0.5);
    }

    return safeListings;
  } catch (error: any) {
    throw new Error(error);
  }
}
