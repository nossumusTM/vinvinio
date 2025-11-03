import prisma from "@/app/libs/prismadb";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";
import { normalizePricingSnapshot } from "@/app/libs/pricing";
import type { SafeListing, SafeUser } from "@/app/types";
import { buildListingsWhereClause } from "./listingFilters";
import type { IListingsParams } from "./listings.types";
export type { IListingsParams } from "./listings.types";
export const dynamic = 'force-dynamic';

export default async function getListings(
  params: IListingsParams,
): Promise<SafeListing[]> {
  try {
    const { sort } = params;

    await Promise.all([
      prisma.listing.updateMany({
        where: { updatedAt: null },
        data: { updatedAt: new Date() },
      }),
      prisma.user.updateMany({
        where: { updatedAt: null },
        data: { updatedAt: new Date() },
      }),
    ]);

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

    const decoratedListings = listingsWithSlug.map((listing) => {
      const totalRating = listing.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      const avgRating = listing.reviews.length > 0 ? totalRating / listing.reviews.length : 0;

      const pricingSnapshot = normalizePricingSnapshot(listing.customPricing, listing.price);

      const { reviews: _reviews, user, ...listingWithoutRelations } = listing;

      const baseListing = listingWithoutRelations as unknown as Omit<
        SafeListing,
        |
          'user'
          | 'price'
          | 'pricingType'
          | 'groupPrice'
          | 'groupSize'
          | 'customPricing'
          | 'languages'
          | 'locationType'
          | 'groupStyles'
          | 'environments'
          | 'activityForms'
          | 'seoKeywords'
      >;

      const safeUser: SafeUser = {
        ...(user as unknown as SafeUser),
        createdAt: user.createdAt.toISOString(),
        updatedAt: (user.updatedAt ?? user.createdAt).toISOString(),
        emailVerified: user.emailVerified?.toISOString() || null,
      };

      const safeListing: SafeListing = {
        ...baseListing,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: (listing.updatedAt ?? listing.createdAt).toISOString(),
        price: pricingSnapshot.basePrice > 0 ? pricingSnapshot.basePrice : listing.price,
        pricingType: pricingSnapshot.mode ?? null,
        groupPrice: pricingSnapshot.groupPrice,
        groupSize: pricingSnapshot.groupSize,
        customPricing: pricingSnapshot.tiers.length > 0 ? pricingSnapshot.tiers.map((tier) => ({ ...tier })) : null,
        languages: Array.isArray(listing.languages) ? [...listing.languages] : [],
        locationType: Array.isArray(listing.locationType) ? [...listing.locationType] : [],
        groupStyles: Array.isArray(listing.groupStyles) ? [...listing.groupStyles] : [],
        environments: Array.isArray(listing.environments) ? [...listing.environments] : [],
        activityForms: Array.isArray(listing.activityForms) ? [...listing.activityForms] : [],
        seoKeywords: Array.isArray(listing.seoKeywords) ? [...listing.seoKeywords] : [],
        user: safeUser,
      };

      return { listing: safeListing, avgRating };
    });

    if (sort === 'rating') {
      decoratedListings.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (sort === 'priceLow') {
      decoratedListings.sort((a, b) => a.listing.price - b.listing.price);
    } else if (sort === 'priceHigh') {
      decoratedListings.sort((a, b) => b.listing.price - a.listing.price);
    } else {
      decoratedListings.sort(() => Math.random() - 0.5);
    }

    return decoratedListings.map((entry) => entry.listing);
  } catch (error: any) {
    throw error;
  }
}
