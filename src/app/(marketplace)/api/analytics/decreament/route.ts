import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { computeAggregateMaps } from '@/app/(marketplace)/libs/aggregateTotals';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const { reservationId } = await req.json();

  if (!reservationId) {
    return new NextResponse('Missing reservationId', { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation || !reservation.referralId) {
    return new NextResponse('No referralId found for this reservation', { status: 200 });
  }

  const user = await prisma.user.findFirst({
    where: { referenceId: reservation.referralId },
  });

  if (!user) {
    return new NextResponse('Referrer not found', { status: 404 });
  }

  const totalPrice = reservation.totalPrice ?? 0;

  const analytics = await prisma.referralAnalytics.findUnique({
    where: { userId: user.id },
  });

  if (analytics) {

    const { dailyTotals, monthlyTotals, yearlyTotals } = computeAggregateMaps(
      analytics.dailyTotals,
      analytics.monthlyTotals,
      analytics.yearlyTotals,
      new Date(),
      -1,
      -totalPrice,
    );

    await prisma.referralAnalytics.update({
      where: { userId: user.id },
      data: {
        totalBooks: Math.max(analytics.totalBooks - 1, 0),
        totalRevenue: Math.max(analytics.totalRevenue - totalPrice, 0),
        dailyTotals,
        monthlyTotals,
        yearlyTotals,
      },
    });
  } else {
    await prisma.referralAnalytics.create({
      data: {
        userId: user.id,
        totalBooks: 0,
        totalRevenue: 0,
        qrScans: 0,
      },
    });
  }

  return NextResponse.json({ message: 'Referral analytics decremented safely' });
}
