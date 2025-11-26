// import { NextResponse } from 'next/server';
// import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
// import prisma from '@/app/(marketplace)/libs/prismadb';
// import { resolvePartnerMetricsForHost } from '@/app/(marketplace)/libs/partnerMetrics';
// import { Prisma } from '@prisma/client';
// import { ObjectId } from 'mongodb';

// export const dynamic = 'force-dynamic';

// const isValidObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

// const getUserFromIdentifier = async (identifier: string) => {
//   const conditions = [];

//   if (isValidObjectId(identifier)) {
//     conditions.push({ id: identifier }); // ✅ Only push if valid ObjectId
//   }

//   conditions.push(
//     { email: { equals: identifier, mode: Prisma.QueryMode.insensitive } },
//     { referenceId: identifier }
//   );

//   return await prisma.user.findFirst({
//     where: {
//       OR: conditions
//     }
//   });
// };

// export async function GET() {
//   const currentUser = await getCurrentUser();

//   if (!currentUser || currentUser.role !== 'host') {
//     return new NextResponse('Unauthorized', { status: 403 });
//   }

//   try {
//     const [analytics, partnerMetrics] = await Promise.all([
//       prisma.hostAnalytics.findUnique({
//         where: { userId: currentUser.id },
//       }),
//       resolvePartnerMetricsForHost(currentUser.id),
//     ]);

//     return NextResponse.json({
//       totalBooks: analytics?.totalBooks || 0,
//       totalRevenue: analytics?.totalRevenue || 0,
//       partnerCommission: partnerMetrics.partnerCommission,
//       punti: partnerMetrics.punti,
//       puntiShare: partnerMetrics.puntiShare,
//       puntiLabel: partnerMetrics.puntiLabel,
//     });
//   } catch (error) {
//     console.error('[HOST_ANALYTICS_GET]', error);
//     return new NextResponse('Internal Server Error', { status: 500 });
//   }
// }

// export async function POST(req: Request) {
//   try {
//     const { identifier } = await req.json();
//     if (!identifier) return new NextResponse('Missing identifier', { status: 400 });

//     const user = await getUserFromIdentifier(identifier);
//     if (!user) return new NextResponse('User not found', { status: 404 });

//     const [analytics, partnerMetrics] = await Promise.all([
//       prisma.hostAnalytics.findUnique({
//         where: { userId: user.id }
//       }),
//       resolvePartnerMetricsForHost(user.id),
//     ]);

//     return NextResponse.json({
//       userId: user.id,
//       totalBooks: analytics?.totalBooks || 0,
//       totalRevenue: analytics?.totalRevenue || 0,
//       partnerCommission: partnerMetrics.partnerCommission,
//       punti: partnerMetrics.punti,
//       puntiShare: partnerMetrics.puntiShare,
//       puntiLabel: partnerMetrics.puntiLabel,
//     });
//   } catch (error) {
//     console.error('[HOST_ANALYTICS_GET]', error);
//     return new NextResponse('Internal Server Error', { status: 500 });
//   }
// }

import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { resolvePartnerMetricsForHost } from '@/app/(marketplace)/libs/partnerMetrics';
import { Prisma } from '@prisma/client';
import { MIN_PARTNER_COMMISSION } from '@/app/(marketplace)/constants/partner';
import { mapToEntries } from '@/app/(marketplace)/libs/aggregateTotals';
import { BASE_CURRENCY } from '@/app/(marketplace)/constants/locale';

export const dynamic = 'force-dynamic';

const isValidObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

const getUserFromIdentifier = async (identifier: string) => {
  const conditions: Prisma.UserWhereInput[] = [];

  if (isValidObjectId(identifier)) {
    conditions.push({ id: identifier });
  }

  conditions.push(
    { email: { equals: identifier, mode: Prisma.QueryMode.insensitive } },
    { referenceId: identifier }
  );

  return prisma.user.findFirst({
    where: { OR: conditions },
  });
};

const parseJsonMaybe = (raw: unknown) => {
  if (typeof raw !== 'string') return raw;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[HOST_ANALYTICS_PARSE_FAILED]', { error, raw });
    return raw;
  }
};

const buildFallbackBreakdown = (
  analytics: { totalBooks?: number | null; totalRevenue?: number | null; createdAt?: Date; updatedAt?: Date },
  commission: number,
) => {
  const bookings = Number(analytics.totalBooks ?? 0);
  const revenue = Number(analytics.totalRevenue ?? 0);

  if (!(bookings > 0 || revenue > 0)) {
    return { daily: [], monthly: [], yearly: [] };
  }

  const anchor = analytics.updatedAt ?? analytics.createdAt ?? new Date();
  const year = anchor.getUTCFullYear();
  const month = String(anchor.getUTCMonth() + 1).padStart(2, '0');
  const day = String(anchor.getUTCDate()).padStart(2, '0');

  const entry = { period: `${year}-${month}-${day}`, bookings, revenue, commission };

  return {
    daily: [entry],
    monthly: [{ ...entry, period: `${year}-${month}` }],
    yearly: [{ ...entry, period: `${year}` }],
  };
};

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'host') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const granularity = new URL(request.url).searchParams.get('granularity');

  try {
    const [analytics, partnerMetrics] = await Promise.all([
      prisma.hostAnalytics.findUnique({
        where: { userId: currentUser.id },
      }),
      resolvePartnerMetricsForHost(currentUser.id),
    ]);

    const partnerCommission =
      typeof partnerMetrics?.partnerCommission === 'number'
        ? partnerMetrics.partnerCommission
        : MIN_PARTNER_COMMISSION;

    const punti =
      typeof partnerMetrics?.punti === 'number' ? partnerMetrics.punti : 0;

    const puntiShare =
      typeof partnerMetrics?.puntiShare === 'number'
        ? partnerMetrics.puntiShare
        : 0;

    const puntiLabel =
      typeof partnerMetrics?.puntiLabel === 'string'
        ? partnerMetrics.puntiLabel
        : 'No punti yet';

    const platformRelevance =
      typeof currentUser.platformRelevance === 'number'
        ? currentUser.platformRelevance
        : 0;

    const dailyEntries = mapToEntries(parseJsonMaybe(analytics?.dailyTotals));
    const monthlyEntries = mapToEntries(parseJsonMaybe(analytics?.monthlyTotals));
    const yearlyEntries = mapToEntries(parseJsonMaybe(analytics?.yearlyTotals));

    const fallback = buildFallbackBreakdown(analytics ?? {}, partnerCommission);

    const breakdown = {
      daily: dailyEntries.length ? dailyEntries : fallback.daily,
      monthly: monthlyEntries.length ? monthlyEntries : fallback.monthly,
      yearly: yearlyEntries.length ? yearlyEntries : fallback.yearly,
      granularity,
    };

    return NextResponse.json({
      totalBooks: analytics?.totalBooks || 0,
      totalRevenue: analytics?.totalRevenue || 0,
      // partnerCommission: partnerMetrics.partnerCommission,
      // punti: partnerMetrics.punti,
      // puntiShare: partnerMetrics.puntiShare,
      // puntiLabel: partnerMetrics.puntiLabel,
      // breakdown: {
      //   daily: mapToEntries(analytics?.dailyTotals),
      //   monthly: mapToEntries(analytics?.monthlyTotals),
      //   yearly: mapToEntries(analytics?.yearlyTotals),
      //   granularity,
      // },
      partnerCommission: partnerCommission,
      punti,
      puntiShare,
      puntiLabel,
      platformRelevance,
      breakdown,
      currency: BASE_CURRENCY,
    });
  } catch (error) {
    console.error('[HOST_ANALYTICS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    if (!identifier) {
      return new NextResponse('Missing identifier', { status: 400 });
    }

    const user = await getUserFromIdentifier(identifier);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const [analytics, partnerMetrics] = await Promise.all([
      prisma.hostAnalytics.findUnique({
        where: { userId: user.id }
      }),
      resolvePartnerMetricsForHost(user.id),
    ]);

    const partnerCommission =
      typeof partnerMetrics?.partnerCommission === 'number'
        ? partnerMetrics.partnerCommission
        : MIN_PARTNER_COMMISSION;

    const punti =
      typeof partnerMetrics?.punti === 'number' ? partnerMetrics.punti : 0;

    const puntiShare =
      typeof partnerMetrics?.puntiShare === 'number'
        ? partnerMetrics.puntiShare
        : 0;

    const puntiLabel =
      typeof partnerMetrics?.puntiLabel === 'string'
        ? partnerMetrics.puntiLabel
        : 'No punti yet';

    const platformRelevance =
      typeof user.platformRelevance === 'number' ? user.platformRelevance : 0;

    const dailyEntries = mapToEntries(parseJsonMaybe(analytics?.dailyTotals));
    const monthlyEntries = mapToEntries(parseJsonMaybe(analytics?.monthlyTotals));
    const yearlyEntries = mapToEntries(parseJsonMaybe(analytics?.yearlyTotals));

    const fallback = buildFallbackBreakdown(analytics ?? {}, partnerCommission);

    const breakdown = {
      daily: dailyEntries.length ? dailyEntries : fallback.daily,
      monthly: monthlyEntries.length ? monthlyEntries : fallback.monthly,
      yearly: yearlyEntries.length ? yearlyEntries : fallback.yearly,
    };

    return NextResponse.json({
      userId: user.id,
      totalBooks: analytics?.totalBooks || 0,
      totalRevenue: analytics?.totalRevenue || 0,
      // partnerCommission: partnerMetrics.partnerCommission,
      // punti: partnerMetrics.punti,
      // puntiShare: partnerMetrics.puntiShare,
      // puntiLabel: partnerMetrics.puntiLabel,
      // breakdown: {
      //   daily: mapToEntries(analytics?.dailyTotals),
      //   monthly: mapToEntries(analytics?.monthlyTotals),
      //   yearly: mapToEntries(analytics?.yearlyTotals),
      // },
      partnerCommission: partnerCommission,
      punti,
      puntiShare,
      puntiLabel,
      platformRelevance,
      breakdown,
      currency: BASE_CURRENCY,
    });
  } catch (error) {
    console.error('[HOST_ANALYTICS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}