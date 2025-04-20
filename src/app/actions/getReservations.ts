import prisma from "@/app/libs/prismadb";
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

    return reservations.map((reservation: any) => ({
      ...reservation,
      startDate: reservation.startDate.toISOString(),
      endDate: reservation.endDate.toISOString(),
      listing: {
        ...reservation.listing,
        createdAt: reservation.listing.createdAt.toISOString(),
        user: {
          ...reservation.listing.user,
          createdAt: reservation.listing.user.createdAt.toISOString(),
        },
      },
    }));
  } catch (error) {
    console.error('❌ Error in getReservations:', error);
    return [];
  }
}

