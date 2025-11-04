// /api/reservations/[reservationId]/cancel/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';

export async function PATCH(
  req: Request,
  { params }: { params: { reservationId: string } } // ✅ Use reservationId
) {
  try {
    const reservationId = params.reservationId;

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[RESERVATION_CANCEL]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}