// /app/api/analytics/increment-scan/route.ts
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { computeAggregateMaps } from '@/app/(marketplace)/libs/aggregateTotals';

export async function POST(req: Request) {
  const body = await req.json();
  const { referenceId } = body;

  if (!referenceId) return new NextResponse('Missing referenceId', { status: 400 });

  const user = await prisma.user.findFirst({
    where: { referenceId }, // ✅ Now valid
  });

  if (!user) return new NextResponse('User not found', { status: 404 });

  const analytics = await prisma.referralAnalytics.findUnique({
    where: { userId: user.id },
  });

  const { dailyTotals, monthlyTotals, yearlyTotals } = computeAggregateMaps(
    analytics?.dailyTotals,
    analytics?.monthlyTotals,
    analytics?.yearlyTotals,
    new Date(),
    0,
    0,
    0,
    1,
  );

  // Update or create analytics
  await prisma.referralAnalytics.upsert({
    where: { userId: user.id },
    update: { qrScans: { increment: 1 }, dailyTotals, monthlyTotals, yearlyTotals },
    create: {
      userId: user.id,
      qrScans: 1,
      totalBooks: 0,
      totalRevenue: 0,
      dailyTotals,
      monthlyTotals,
      yearlyTotals,
    },
  });

  return NextResponse.json({ message: 'QR scan recorded' });
}