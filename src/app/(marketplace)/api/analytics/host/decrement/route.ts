import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import { computeAggregateMaps } from '@/app/(marketplace)/libs/aggregateTotals';
import { MIN_PARTNER_COMMISSION, computeHostShareFromCommission } from '@/app/(marketplace)/constants/partner';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  const moderationEnabled = process.env.NODE_ENV !== 'production';

  if (
    !currentUser ||
    (currentUser.role !== 'host' && (currentUser.role !== 'moder' || !moderationEnabled))
  ) {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  // const { hostId, totalPrice } = await req.json();
  const { hostId, totalPrice, reservationDate } = await req.json();

  const parsedDate = reservationDate
    ? new Date(
        typeof reservationDate === 'string'
          ? `${reservationDate}T00:00:00Z`
          : reservationDate,
      )
    : null;

  const analyticsDate = (() => {
    const baseDate =
      parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : new Date();

    return new Date(
      Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate()),
    );
  })();

  if (!hostId) {
    return new NextResponse('Missing hostId', { status: 400 });
  }

  try {
    
    const hostUser = await prisma.user.findUnique({
      where: { id: hostId },
      select: { partnerCommission: true },
    });

    const partnerCommission = Number.isFinite(hostUser?.partnerCommission)
      ? (hostUser?.partnerCommission as number)
      : MIN_PARTNER_COMMISSION;
    const hostShare = computeHostShareFromCommission(partnerCommission);
    const revenueDelta = (totalPrice || 0) * hostShare;

    // Get current values to prevent negative numbers
    const current = await prisma.hostAnalytics.findUnique({
      where: { userId: hostId },
    });

    const newBooks = Math.max(0, (current?.totalBooks || 0) - 1);
    // const newRevenue = Math.max(0, (current?.totalRevenue || 0) - (totalPrice || 0));
    const newRevenue = Math.max(0, (current?.totalRevenue || 0) - revenueDelta);

    const { dailyTotals, monthlyTotals, yearlyTotals } = computeAggregateMaps(
      current?.dailyTotals,
      current?.monthlyTotals,
      current?.yearlyTotals,
      // new Date(),
      analyticsDate,
      -1,
      -revenueDelta,
      -partnerCommission,
    );

    await prisma.hostAnalytics.upsert({
      where: { userId: hostId },
      update: {
        totalBooks: newBooks,
        totalRevenue: newRevenue,
        dailyTotals,
        monthlyTotals,
        yearlyTotals,
      },
      create: {
        userId: hostId,
        totalBooks: 0,
        totalRevenue: 0,
      },
    });

    return NextResponse.json({ message: 'Host analytics decremented.' });
  } catch (error) {
    console.error('[HOST_ANALYTICS_DECREMENT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
