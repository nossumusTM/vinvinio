// /api/reservations/[reservationId]/cancel/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';

export async function PATCH(
  req: Request,
  { params }: { params: { reservationId: string } } // ✅ Use reservationId
) {
  try {
    const reservationId = params.reservationId;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { listing: { select: { userId: true } } },
    });

    if (!reservation) {
      return new NextResponse('Reservation not found', { status: 404 });
    }

    // Avoid double-decrementing if someone retries the cancel request
    if (reservation.status === 'cancelled') {
      return NextResponse.json({ success: true });
    }

    const hostId = reservation.listing?.userId;

    const { hostBookingCount } = await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'cancelled' },
      });

      if (!hostId) {
        return { hostBookingCount: undefined as number | undefined };
      }

      const host = await tx.user.findUnique({
        where: { id: hostId },
        select: { allTimeBookingCount: true },
      });

      const nextCount = Math.max(0, (host?.allTimeBookingCount ?? 0) - 1);

      const updatedHost = await tx.user.update({
        where: { id: hostId },
        data: { allTimeBookingCount: nextCount },
        select: { allTimeBookingCount: true },
      });

      const hostAnalytics = await tx.hostAnalytics.findUnique({
        where: { userId: hostId },
        select: { totalBooks: true },
      });

      if (hostAnalytics) {
        const nextTotalBooks = Math.max(0, (hostAnalytics.totalBooks ?? 0) - 1);
        await tx.hostAnalytics.update({
          where: { userId: hostId },
          data: { totalBooks: nextTotalBooks },
        });
      }

      return { hostBookingCount: updatedHost.allTimeBookingCount };
    });

    return NextResponse.json({ success: true, bookingCount: hostBookingCount });
  } catch (error) {
    console.error('[RESERVATION_CANCEL]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}