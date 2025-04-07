import prisma from "@/app/libs/prismadb";
export const dynamic = 'force-dynamic';

interface IParams {
  listingId?: string;
  userId?: string;
  authorId?: string;
}

// export default async function getReservations(params: IParams) {
//   try {
//     const { listingId, userId, authorId } = params;

//     const query: any = {};

//     if (listingId) {
//       query.listingId = listingId;
//     }

//     if (userId) {
//       query.userId = userId;
//     }

//     if (authorId) {
//       query.listing = { userId: authorId };
//     }

//     const reservations = await prisma.reservation.findMany({
//       where: {
//         ...query,
//         listing: {
//           isNot: null,
//         },
//       },
//       include: {
//         listing: {
//           include: {
//             user: true, // ✅ Include host info
//           },
//         },
//         user: true, // ✅ Add guest info!
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     // const safeReservations = reservations.map((reservation: any) => ({
//     //   ...reservation,
//     //   createdAt: reservation.createdAt.toISOString(),
//     //   startDate: reservation.startDate.toISOString(),
//     //   endDate: reservation.endDate.toISOString(),
//     //   time: reservation.time,
//     //   guestCount: reservation.guestCount, // ✅ Include guest count
//     //   listing: {
//     //     ...reservation.listing,
//     //     createdAt: reservation.listing.createdAt.toISOString(),
//     //     user: {
//     //       ...reservation.listing.user,
//     //       createdAt: reservation.listing.user.createdAt.toISOString(),
//     //       updatedAt: reservation.listing.user.updatedAt.toISOString(),
//     //     },
//     //   },
//     // }));
//     const safeReservations = reservations.map((reservation: any) => ({
//       ...reservation,
//       createdAt: reservation.createdAt.toISOString(),
//       startDate: reservation.startDate.toISOString(),
//       endDate: reservation.endDate.toISOString(),
//       time: reservation.time,
//       guestCount: reservation.guestCount,
//       listing: {
//         ...reservation.listing,
//         createdAt: reservation.listing.createdAt.toISOString(),
//         user: {
//           ...reservation.listing.user,
//           createdAt: reservation.listing.user.createdAt.toISOString(),
//           updatedAt: reservation.listing.user.updatedAt.toISOString(),
//         },
//       },
//       user: {
//         ...reservation.user,
//         createdAt: reservation.user.createdAt.toISOString(),
//         updatedAt: reservation.user.updatedAt.toISOString(),
//       },
//     }));    

//     return safeReservations;
//   } catch (error: any) {
//     console.error("Error fetching reservations:", error);
//     throw new Error("Failed to fetch reservations.");
//   }
// }

interface IReservationParams {
  userId?: string;
  listingId?: string;
}

interface IReservationParams {
  userId?: string;
  listingId?: string;
  authorId?: string; // ✅ Add this
}

export default async function getReservations(params: IReservationParams) {
  try {
    const { userId, listingId, authorId } = params;

    const reservations = await prisma.reservation.findMany({
      where: {
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

