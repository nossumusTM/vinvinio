import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { computeAggregateMaps } from '@/app/(marketplace)/libs/aggregateTotals';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'host') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const { totalPrice } = await req.json(); // expects totalPrice from reservation

  try {
    // Ensure HostAnalytics exists for this host
    const existing = await prisma.hostAnalytics.findUnique({
      where: { userId: currentUser.id },
      // update: {
      //   totalBooks: { increment: 1 },
      //   totalRevenue: { increment: totalPrice || 0 },
      // },
      // create: {
      //   userId: currentUser.id,
      //   totalBooks: 1,
      //   totalRevenue: totalPrice || 0,
      // },
    });

    const { dailyTotals, monthlyTotals, yearlyTotals } = computeAggregateMaps(
      existing?.dailyTotals,
      existing?.monthlyTotals,
      existing?.yearlyTotals,
      new Date(),
      1,
      totalPrice || 0,
    );

    if (existing) {
      await prisma.hostAnalytics.update({
        where: { userId: currentUser.id },
        data: {
          totalBooks: { increment: 1 },
          totalRevenue: { increment: totalPrice || 0 },
          dailyTotals,
          monthlyTotals,
          yearlyTotals,
        },
      });
    } else {
      await prisma.hostAnalytics.create({
        data: {
          userId: currentUser.id,
          totalBooks: 1,
          totalRevenue: totalPrice || 0,
          dailyTotals,
          monthlyTotals,
          yearlyTotals,
        },
      });
    }

    return NextResponse.json({ message: 'Host analytics incremented.' });
  } catch (error) {
    console.error('[HOST_ANALYTICS_INCREMENT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
