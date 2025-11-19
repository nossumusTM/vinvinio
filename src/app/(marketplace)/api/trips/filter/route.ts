// app/api/trips/filter/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { startDate, endDate, time, year } = body;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const reservations = await prisma.reservation.findMany({
      where: {
        userId: currentUser.id,
        startDate: {
          gte: start,
          lte: end,
        },
        ...(time && { time }),
        // year is technically redundant if startDate range already covers it,
        // but you can add extra checks if needed
      },
      include: {
        listing: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(reservations);
  } catch (err) {
    console.error('🔴 Trips filter API error:', err);
    return NextResponse.json(
      { error: 'Trips filter failed on the server.' },
      { status: 500 }
    );
  }
}