import { NextResponse } from 'next/server';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { findUserIdByHandle } from '@/app/(marketplace)/libs/userHandles';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const reservationId = (searchParams.get('reservationId') ?? '').trim();
  const identifier = (searchParams.get('identifier') ?? '').trim();

  if (!reservationId && !identifier) {
    return new NextResponse('Provide a reservationId or username.', { status: 400 });
  }

  try {
    let userId: string | null = null;

    if (!reservationId && identifier) {
      userId = await findUserIdByHandle(identifier);
      if (!userId) {
        return new NextResponse('User not found.', { status: 404 });
      }
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        ...(reservationId ? { id: reservationId } : {}),
        ...(userId ? { userId } : {}),
      },
      include: {
        user: true,
        listing: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!reservations.length) {
      return new NextResponse('No reservations found.', { status: 404 });
    }

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('[MODER_RESERVATION_LOOKUP]', error);
    return new NextResponse('Failed to fetch reservations.', { status: 500 });
  }
}