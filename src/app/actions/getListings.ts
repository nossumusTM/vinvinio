import prisma from "@/app/libs/prismadb";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";
import type { SafeListing } from "@/app/types";
import { toSafeListing } from "@/app/libs/serializers";
import { buildListingsWhereClause } from "./listingFilters";
import type { IListingsParams } from "./listings.types";
export type { IListingsParams } from "./listings.types";
export const dynamic = 'force-dynamic';

export default async function getListings(
  params: IListingsParams,
): Promise<SafeListing[]> {
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
      listings.map(async (listing) => {
        try {
          return await ensureListingSlug(listing);
        } catch (error) {
          console.error(
            "[GET_LISTINGS] Failed to ensure slug",
            { listingId: listing.id },
            error,
          );
          return listing;
        }
      })
    );

    const decoratedListings = listingsWithSlug
      .map((listing) => {
        try {
          const reviews = Array.isArray(listing.reviews) ? listing.reviews : [];
          const totalRating = reviews.reduce(
            (sum, r) => sum + Number(r?.rating ?? 0),
            0,
          );
          const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

          return { listing: toSafeListing(listing), avgRating };
        } catch (error) {
          console.error(
            "[GET_LISTINGS] Failed to serialize listing",
            { listingId: listing.id },
            error,
          );
          return null;
        }
      })
      .filter((entry): entry is { listing: SafeListing; avgRating: number } => entry !== null);

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
  } catch (error) {
    console.error("[GET_LISTINGS]", error);
    throw (error instanceof Error ? error : new Error(String(error)));
  }
}
