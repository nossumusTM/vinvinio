import prisma from "@/app/(marketplace)/libs/prismadb";

export default async function getListingReservations(listingId: string) {
  try {
    const reservations = await prisma.reservation.findMany({
        where: {
          listingId,
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

    const normalizeTime = (time: string) => {
        const [h, m] = time.split(':').slice(0, 2);
        return `${h.padStart(2, '0')}:${m?.padStart(2, '0') ?? '00'}`;
      };

    return reservations.map((reservation: any) => ({
        ...reservation,
        startDate: reservation.startDate.toISOString(),
        endDate: reservation.endDate.toISOString(),
        time: reservation.time ? normalizeTime(reservation.time) : '',
        listing: {
          ...reservation.listing,
          createdAt: reservation.listing.createdAt.toISOString(),
          user: {
            ...reservation.listing.user,
            createdAt: reservation.listing.user.createdAt.toISOString(),
          },
        },
        user: reservation.user
          ? {
              ...reservation.user,
              createdAt: reservation.user.createdAt.toISOString(),
            }
          : null,
      }));      
      
  } catch (error) {
    console.error('❌ Error in getListingReservations:', error);
    return [];
  }
}
