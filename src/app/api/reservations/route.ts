import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
export const dynamic = 'force-dynamic';
import { Prisma } from '@prisma/client';

// export async function POST(request: Request) {
//   try {
//     const currentUser = await getCurrentUser();

//     if (!currentUser) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     const body = await request.json();
//     const {
//       listingId,
//       startDate,
//       endDate,
//       totalPrice,
//       referralId,
//       selectedTime,
//       guestCount,
//     } = body;

//     if (!listingId || !startDate || !endDate || !totalPrice || !selectedTime) {
//       return new NextResponse("Missing required fields", { status: 400 });
//     }

//     const resolvedGuestCount = guestCount ?? 1;

//     const listingAndReservation = await prisma.listing.update({
//       where: {
//         id: listingId,
//       },
//       data: {
//         reservations: {
//           create: {
//             user: {
//               connect: { id: currentUser.id },
//             },
//             startDate,
//             endDate,
//             totalPrice,
//             time: selectedTime,
//             referralId: referralId || null,
//             guestCount: resolvedGuestCount,
//           },
//         },
//       },
//     });

//     const fullListing = await prisma.listing.findUnique({
//       where: { id: listingId },
//       include: { user: true },
//     });

//     const formattedDateTime = (() => {
//       try {
//         const baseDate = new Date(startDate);
//         const [hourStr, minuteStr] = selectedTime.split(':');
//         baseDate.setHours(parseInt(hourStr));
//         baseDate.setMinutes(parseInt(minuteStr));

//         const datePart = baseDate.toLocaleDateString('en-US', {
//           year: 'numeric',
//           month: 'short',
//           day: 'numeric',
//         });

//         const timePart = baseDate.toLocaleTimeString('en-US', {
//           hour: 'numeric',
//           minute: '2-digit',
//           hour12: true,
//         });

//         return `${datePart} ${timePart}`;
//       } catch {
//         return 'Unavailable';
//       }
//     })();

//     if (fullListing?.user?.email) {
//       await fetch(`${process.env.NEXTAUTH_URL}/api/email/notify-host`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           hostEmail: fullListing.user.email,
//           hostName: fullListing.user.name,
//           guestName: currentUser.name || 'Guest',
//           legalName: currentUser.legalName || '',
//           contact: currentUser.contact || '',
//           total: totalPrice,
//           guests: resolvedGuestCount,
//           formattedDateTime,
//           listingTitle: fullListing.title,
//         }),
//       });
//     }

//     return NextResponse.json(listingAndReservation);
//   } catch (error) {
//     console.error("Error creating reservation:", error);
//     return new NextResponse("Internal Server Error", { status: 500 });
//   }
// }

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    const {
      listingId,
      startDate,
      endDate,
      totalPrice,
      referralId,
      selectedTime,
      guestCount,
      legalName,
      contact,
    } = body;

    if (!listingId || !startDate || !endDate || !totalPrice || !selectedTime) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const resolvedGuestCount = guestCount ?? 1;

    const reservationData: Prisma.ReservationCreateInput = currentUser
      ? {
          user: { connect: { id: currentUser.id } },
          listing: { connect: { id: listingId } },
          startDate,
          endDate,
          totalPrice,
          time: selectedTime,
          referralId: referralId || null,
          guestCount: resolvedGuestCount,
        }
      : {
          listing: { connect: { id: listingId } },
          startDate,
          endDate,
          totalPrice,
          time: selectedTime,
          referralId: referralId || null,
          guestCount: resolvedGuestCount,
          guestName: legalName || 'Guest',
          guestContact: contact || '',
        };

    const reservation = await prisma.reservation.create({
      data: reservationData,
    });
    

    const fullListing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true },
    });

    const formattedDateTime = (() => {
      try {
        const baseDate = new Date(startDate);
        const [hourStr, minuteStr] = selectedTime.split(':');
        baseDate.setHours(parseInt(hourStr));
        baseDate.setMinutes(parseInt(minuteStr));

        const datePart = baseDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

        const timePart = baseDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return `${datePart} ${timePart}`;
      } catch {
        return 'Unavailable';
      }
    })();

    const displayGuestName = currentUser?.name ?? legalName ?? 'Guest';
    const guestContact = currentUser?.contact ?? contact ?? '';

    if (fullListing?.user?.email) {
      await fetch(`${process.env.NEXTAUTH_URL}/api/email/notify-host`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostEmail: fullListing.user.email,
          hostName: fullListing.user.name,
          hostContact: fullListing.user.contact || '',
          guestName: displayGuestName,       // <- properly resolved
          contact: guestContact,             // <- properly resolved
          total: totalPrice,
          guests: resolvedGuestCount,
          formattedDateTime,
          listingTitle: fullListing.title,
          listingId: fullListing.id,
        }),
      });      
    }


    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error creating reservation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}