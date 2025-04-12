import prisma from "@/app/libs/prismadb";
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
      sort
    } = params;

    let query: any = {};

    if (userId) {
      query.userId = userId;
    }

    if (category) {
      query.category = category;
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
        reviews: true, // include related reviews
      },
    });

    // const safeListings = listings.map((listing: any) => ({
    //   ...listing,
    //   createdAt: listing.createdAt.toISOString(),
    // }));

    const safeListings = listings.map((listing) => {
      const totalRating = listing.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      const avgRating = listing.reviews.length > 0 ? totalRating / listing.reviews.length : 0;

      return {
        ...listing,
        createdAt: listing.createdAt.toISOString(),
        avgRating,
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
