import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const {
      listingId,
      startDate,
      endDate,
      totalPrice,
      referralId,
      selectedTime, // ✅ Make sure this is included
      guestCount, // ✅ make sure this is extracted
    } = body;

    if (!listingId || !startDate || !endDate || !totalPrice || !selectedTime) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const resolvedGuestCount = guestCount ?? 1; // fallback to 1

    const listingAndReservation = await prisma.listing.update({
      where: {
        id: listingId,
      },
      data: {
        reservations: {
          create: {
            user: {
              connect: { id: currentUser.id }, // ✅ correct
            },
            startDate,
            endDate,
            totalPrice,
            time: selectedTime, // ✅ required if in schema
            referralId: referralId || null,
            guestCount: resolvedGuestCount
            // ❗️ Add selectedTime to your Reservation model if not already there
          },
        },
      },
    });

    return NextResponse.json(listingAndReservation);
  } catch (error) {
    console.error("Error creating reservation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
