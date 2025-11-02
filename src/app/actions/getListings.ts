import prisma from "@/app/libs/prismadb";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";
export const dynamic = 'force-dynamic';

export interface IListingsParams {
  userId?: string;
  guestCount?: number;
  roomCount?: number;
  bathroomCount?: number;
  startDate?: string;
  endDate?: string;
  locationValue?: string;
  category?: string;
  sort?: 'rating' | 'priceLow' | 'priceHigh' | 'random';
  skip?: number;
  take?: number;
  groupStyles?: string[] | string;
  duration?: string;
  environments?: string[] | string;
  activityForms?: string[] | string;
  seoKeywords?: string[] | string;
  languages?: string[] | string;
}

export default async function getListings(params: IListingsParams) {
  try {
    const {
      userId,
      roomCount,
      guestCount,
      bathroomCount,
      locationValue,
      startDate,
      endDate,
      category,
      sort,
      groupStyles,
      duration,
      environments,
      activityForms,
      seoKeywords,
      languages,
    } = params;

    let query: any = {};

    const parseArrayParam = (value?: string | string[]) => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value
          .flatMap((item) => String(item).split(','))
          .map((item) => item.trim())
          .filter(Boolean);
      }

      return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    };

    if (userId) {
      query.userId = userId;
    }

    query.status = 'approved';

    // if (category) {
    //   query.category = {
    //     has: category,
    //   };
    // }    

    if (category) {
      const value = Array.isArray(category) ? category[0] : category;
      query.category = {
        has: value,
      };
    }

    const groupStyleFilter = parseArrayParam(groupStyles);
    if (groupStyleFilter.length > 0) {
      query.groupStyles = {
        hasSome: groupStyleFilter,
      };
    }

    if (typeof duration === 'string' && duration.trim().length > 0) {
      query.durationCategory = duration;
    }

    const environmentFilter = parseArrayParam(environments);
    if (environmentFilter.length > 0) {
      query.environments = {
        hasSome: environmentFilter,
      };
    }

    const activityFormFilter = parseArrayParam(activityForms);
    if (activityFormFilter.length > 0) {
      query.activityForms = {
        hasSome: activityFormFilter,
      };
    }

    const keywordFilter = parseArrayParam(seoKeywords);
    if (keywordFilter.length > 0) {
      query.seoKeywords = {
        hasSome: keywordFilter,
      };
    }

    const languageFilter = parseArrayParam(languages);
    if (languageFilter.length > 0) {
      query.languages = {
        hasSome: languageFilter,
      };
    }

    if (roomCount) {
      query.roomCount = {
        gte: +roomCount,
      };
    }

    if (guestCount) {
      query.guestCount = {
        gte: +guestCount,
      };
    }

    if (bathroomCount) {
      query.bathroomCount = {
        gte: +bathroomCount,
      };
    }

    if (locationValue) {
      query.locationValue = locationValue;
    }

    if (startDate && endDate) {
      query.NOT = {
        reservations: {
          some: {
            OR: [
              {
                endDate: { gte: startDate },
                startDate: { lte: startDate },
              },
              {
                startDate: { lte: endDate },
                endDate: { gte: endDate },
              },
            ],
          },
        },
      };
    }

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

      return {
        ...listing,
        createdAt: listing.createdAt.toISOString(),
        avgRating,
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
