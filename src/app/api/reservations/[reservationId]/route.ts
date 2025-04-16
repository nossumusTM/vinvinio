import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

interface IParams {
  reservationId?: string;
}

// export async function GET(
//   req: Request,
//   { params }: { params: IParams }
// ) {
//   const { reservationId } = params;

//   if (!reservationId || typeof reservationId !== "string") {
//     return new NextResponse("Invalid reservation ID", { status: 400 });
//   }

//   try {
//     const reservation = await prisma.reservation.findUnique({
//       where: { id: reservationId },
//     });

//     if (!reservation) {
//       return new NextResponse("Reservation not found", { status: 404 });
//     }

//     return NextResponse.json(reservation);
//   } catch (error) {
//     console.error("Error fetching reservation:", error);
//     return new NextResponse("Internal Server Error", { status: 500 });
//   }
// }

export async function GET(
  req: Request,
  { params }: { params: IParams }
) {
  const { reservationId } = params;

  if (!reservationId || typeof reservationId !== "string") {
    return new NextResponse("Invalid reservation ID", { status: 400 });
  }

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        listing: {
          select: {
            userId: true, // ✅ Include host ID here
          },
        },
      },
    });

    if (!reservation) {
      return new NextResponse("Reservation not found", { status: 404 });
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: IParams }
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const { reservationId } = params;

  if (!reservationId || typeof reservationId !== "string") {
    throw new Error("Invalid ID");
  }

  const reservation = await prisma.reservation.deleteMany({
    where: {
      id: reservationId,
      OR: [{ userId: currentUser.id }, { listing: { userId: currentUser.id } }],
    },
  });

  return NextResponse.json(reservation);
}
