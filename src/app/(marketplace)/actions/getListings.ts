import prisma from "@/app/(marketplace)/libs/prismadb";
import { ensureListingSlug } from "@/app/(marketplace)/libs/ensureListingSlug";
import { normalizePricingSnapshot } from "@/app/(marketplace)/libs/pricing";
import type { SafeListing, SafeUser } from "@/app/(marketplace)/types";
import { Prisma } from "@prisma/client";
import { buildListingsWhereClause } from "./listingFilters";
import type { IListingsParams } from "./listings.types";
export type { IListingsParams } from "./listings.types";
export const dynamic = 'force-dynamic';

export default async function getListings(
  params: IListingsParams,
): Promise<SafeListing[]> {
  try {
    const { sort } = params;

    const backfillMissingUpdatedAt = (
      collection: "Listing" | "User",
    ): Prisma.InputJsonObject => ({
      update: collection,
      updates: [
        {
          q: {
            $or: [
              { updatedAt: { $exists: false } },
              { updatedAt: null },
            ],
          },
          u: [
            {
              $set: {
                updatedAt: {
                  $ifNull: [
                    "$updatedAt",
                    { $ifNull: ["$createdAt", "$$NOW"] },
                  ],
                },
              },
            },
          ],
          multi: true,
        },
      ],
    });

    await Promise.all([
      prisma.$runCommandRaw(backfillMissingUpdatedAt("Listing")),
      prisma.$runCommandRaw(backfillMissingUpdatedAt("User")),
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

      const prismaUser = user as unknown as SafeUser & {
        visitedCountries?: string[];
        visitedCities?: string[];
        hobbies?: string[];
        preferredContacts?: string[];
        bio?: string | null;
        profession?: string | null;
        identityVerified?: boolean;
      };

      const safeUser: SafeUser = {
        ...(prismaUser as SafeUser),
        createdAt: user.createdAt.toISOString(),
        updatedAt: (user.updatedAt ?? user.createdAt).toISOString(),
        emailVerified: user.emailVerified?.toISOString() || null,
        bio: prismaUser.bio ?? null,
        visitedCountries: Array.isArray(prismaUser.visitedCountries) ? [...prismaUser.visitedCountries] : [],
        visitedCities: Array.isArray(prismaUser.visitedCities) ? [...prismaUser.visitedCities] : [],
        profession: prismaUser.profession ?? null,
        hobbies: Array.isArray(prismaUser.hobbies) ? [...prismaUser.hobbies] : [],
        preferredContacts: Array.isArray(prismaUser.preferredContacts) ? [...prismaUser.preferredContacts] : [],
        identityVerified: typeof prismaUser.identityVerified === 'boolean' ? prismaUser.identityVerified : false,
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
