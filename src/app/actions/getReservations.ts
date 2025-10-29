import prisma from "@/app/libs/prismadb";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";
export const dynamic = 'force-dynamic';

interface IParams {
  listingId?: string;
  userId?: string;
  authorId?: string;
}

interface IReservationParams {
  userId?: string;
  listingId?: string;
}

interface IReservationParams {
  userId?: string;
  listingId?: string;
  authorId?: string; // ✅ Add this
  skip?: number;
  take?: number;
}

export default async function getReservations(params: IReservationParams) {
  try {
    const { userId, listingId, authorId, skip = 0, take = 4 } = params;

    const reservations = await prisma.reservation.findMany({
      skip,
      take,
      where: {
        // status: {
        //   not: 'cancelled', // ✅ Exclude cancelled reservations
        // },
        ...(userId && { userId }),
        ...(listingId && { listingId }),
        ...(authorId && {
          listing: {
            userId: authorId,
          },
        }),
      },
      include: {
        user: true,
        listing: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Promise.all(
      reservations.map(async (reservation: any) => {
        const listingWithSlug = await ensureListingSlug(reservation.listing);

        return {
          ...reservation,
          startDate: reservation.startDate.toISOString(),
          endDate: reservation.endDate.toISOString(),
          listing: {
            ...listingWithSlug,
            createdAt: listingWithSlug.createdAt.toISOString(),
            user: {
              ...listingWithSlug.user,
              createdAt: listingWithSlug.user.createdAt.toISOString(),
            },
          },
        };
      })
    );
  } catch (error) {
    console.error('❌ Error in getReservations:', error);
    return [];
  }
}

