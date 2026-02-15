// /app/api/analytics/update/route.ts
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

  const body = await req.json();
  const { referenceId, totalBooksIncrement = 1, totalRevenueIncrement = 0 } = body;

  if (!referenceId) {
    return new NextResponse('Missing referenceId', { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { referenceId }
  });

  if (!user) {
    return new NextResponse('User not found', { status: 404 });
  }

  const existingAnalytics = await prisma.referralAnalytics.findUnique({
    where: { userId: user.id },
    // update: {
    //   totalBooks: { increment: totalBooksIncrement },
    //   totalRevenue: { increment: totalRevenueIncrement },
    // },
    // create: {
    //   userId: user.id,
    //   totalBooks: totalBooksIncrement,
    //   totalRevenue: totalRevenueIncrement,
    //   qrScans: 0,
    // }
  });

  const { dailyTotals, monthlyTotals, yearlyTotals } = computeAggregateMaps(
    existingAnalytics?.dailyTotals,
    existingAnalytics?.monthlyTotals,
    existingAnalytics?.yearlyTotals,
    new Date(),
    totalBooksIncrement,
    totalRevenueIncrement,
  );

  if (existingAnalytics) {
    await prisma.referralAnalytics.update({
      where: { userId: user.id },
      data: {
        totalBooks: { increment: totalBooksIncrement },
        totalRevenue: { increment: totalRevenueIncrement },
        dailyTotals,
        monthlyTotals,
        yearlyTotals,
      },
    });
  } else {
    await prisma.referralAnalytics.create({
      data: {
        userId: user.id,
        totalBooks: totalBooksIncrement,
        totalRevenue: totalRevenueIncrement,
        qrScans: 0,
        dailyTotals,
        monthlyTotals,
        yearlyTotals,
      },
    });
  }

  return NextResponse.json({ message: 'Referral analytics updated' });
}
