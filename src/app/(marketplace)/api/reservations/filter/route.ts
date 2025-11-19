import { NextResponse } from 'next/server';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import getReservations from '@/app/(marketplace)/actions/getReservations';
import { resolveDateBounds } from '@/app/(marketplace)/libs/dateFilter';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const payload = await request.json();
    const { from, to } = resolveDateBounds({
      startDate: payload?.startDate,
      endDate: payload?.endDate,
      time: payload?.time,
      year: payload?.year,
    });

    const reservations = await getReservations({
      authorId: currentUser.id,
      dateFrom: from,
      dateTo: to,
      take: 50,
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Failed to filter reservations', error);
    return new NextResponse('Unable to fetch filtered reservations', { status: 500 });
  }
}