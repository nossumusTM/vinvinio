import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { ReservationStatus } from '@prisma/client';

export const dynamic = 'force-dynamic'; // recommended for SSR/ISR consistency

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get('listingId');

  if (!listingId) {
    return new NextResponse('Missing listingId', { status: 400 });
  }

  try {
    const reservations = await prisma.reservation.findMany({
      where: {
        listingId,
        status: {
        not: ReservationStatus.cancelled, // 👈 exclude cancelled
    },
      },
      select: {
        startDate: true,
        time: true,
      },
    });

    const bookedSlots = reservations.map((res) => ({
      date: res.startDate.toISOString().split('T')[0], // 'YYYY-MM-DD'
      time: res.time,
    }));

    return NextResponse.json(bookedSlots);
  } catch (err) {
    console.error('[BOOKED_SLOTS_ERROR]', err);
    return new NextResponse('Failed to fetch booked slots', { status: 500 });
  }
}