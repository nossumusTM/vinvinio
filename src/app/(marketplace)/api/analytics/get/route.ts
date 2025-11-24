// /app/api/analytics/get/route.ts
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/app/(marketplace)/libs/prismadb';
 import getCurrentUser from  '@/app/(marketplace)/actions/getCurrentUser';
 import { Prisma } from '@prisma/client';
 import { ObjectId } from 'mongodb';
 import { mapToEntries } from '@/app/(marketplace)/libs/aggregateTotals';

const isValidObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

const getUserFromIdentifier = async (identifier: string) => {
  const filters: Prisma.UserWhereInput[] = [];

  // ✅ Only push ID filter if it's valid ObjectId
  if (isValidObjectId(identifier)) {
    filters.push({ id: identifier });
  }

  // ✅ Always try matching email and referenceId
  filters.push(
    { email: { equals: identifier, mode: Prisma.QueryMode.insensitive } },
    { referenceId: identifier }
  );

  return await prisma.user.findFirst({
    where: {
      OR: filters
    }
  });
};

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) return new NextResponse('Unauthorized', { status: 401 });

  const analytics = await prisma.referralAnalytics.findUnique({
    where: { userId: currentUser.id }
  });

  return NextResponse.json({
    totalBooks: analytics?.totalBooks || 0,
    qrScans: analytics?.qrScans || 0,
    totalRevenue: analytics?.totalRevenue || 0,
    breakdown: {
      daily: mapToEntries(analytics?.dailyTotals),
      monthly: mapToEntries(analytics?.monthlyTotals),
      yearly: mapToEntries(analytics?.yearlyTotals),
    },
  });
}

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    if (!identifier) return new NextResponse('Missing identifier', { status: 400 });

    const user = await getUserFromIdentifier(identifier);
    if (!user) return new NextResponse('User not found', { status: 404 });

    const analytics = await prisma.referralAnalytics.findUnique({
      where: { userId: user.id }
    });

    return NextResponse.json({
      userId: user.id,
      totalBooks: analytics?.totalBooks || 0,
      qrScans: analytics?.qrScans || 0,
      totalRevenue: analytics?.totalRevenue || 0,
      breakdown: {
        daily: mapToEntries(analytics?.dailyTotals),
        monthly: mapToEntries(analytics?.monthlyTotals),
        yearly: mapToEntries(analytics?.yearlyTotals),
      },
    });
  } catch (error) {
    console.error('[PROMOTER_ANALYTICS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}