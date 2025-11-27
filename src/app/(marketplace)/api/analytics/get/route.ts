// /app/api/analytics/get/route.ts
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/app/(marketplace)/libs/prismadb';
 import getCurrentUser from  '@/app/(marketplace)/actions/getCurrentUser';
 import { Prisma } from '@prisma/client';
 import { ObjectId } from 'mongodb';
import {
  mapToEntries,
  summarizeEntries,
  type AggregateEntry,
} from '@/app/(marketplace)/libs/aggregateTotals';

type Granularity = 'day' | 'month' | 'year';

const normalizeDateParam = (value: string | null): Date | null => {
  if (!value) return null;

  const trimmed = String(value).trim();

  // Accept YYYY, YYYY-MM, or YYYY-MM-DD – regardless of time-zone info
  const match = trimmed.match(/^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?/);
  if (match) {
    const [, yRaw, mRaw, dRaw] = match;
    const year = Number(yRaw);
    const month = Number(mRaw ?? 1);
    const day = Number(dRaw ?? 1);

    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      return Number.isNaN(utcDate.getTime()) ? null : utcDate;
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const matchesPeriod = (
  period: string,
  granularity: Granularity,
  targetDate: Date | null,
) => {
  if (!targetDate) return true;

  const [datePart] = String(period ?? '').split('T');
  const [yearRaw, monthRaw, dayRaw] = datePart.split('-');

  const targetYear = targetDate.getUTCFullYear();
  const targetMonth = targetDate.getUTCMonth() + 1;
  const targetDay = targetDate.getUTCDate();

  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isFinite(year)) return false;

  if (granularity === 'year') return year === targetYear;

  if (!Number.isFinite(month)) return false;

  if (granularity === 'month') {
    return year === targetYear && month === targetMonth;
  }

  return year === targetYear && month === targetMonth && day === targetDay;
};

const filterEntries = (
  entries: AggregateEntry[],
  granularity: Granularity,
  targetDate: Date | null,
) => entries.filter((entry) => matchesPeriod(entry.period, granularity, targetDate));

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

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(request.url);
  const granularityParam = searchParams.get('granularity');
  const granularity: Granularity =
    granularityParam === 'month'
      ? 'month'
      : granularityParam === 'year'
      ? 'year'
      : 'day';
  const targetDate = normalizeDateParam(searchParams.get('date'));

  const analytics = await prisma.referralAnalytics.findUnique({
    where: { userId: currentUser.id }
  });

  const dailyEntries = mapToEntries(analytics?.dailyTotals);
  const monthlyEntries = mapToEntries(analytics?.monthlyTotals);
  const yearlyEntries = mapToEntries(analytics?.yearlyTotals);

  const filteredBreakdown = {
    daily: filterEntries(dailyEntries, 'day', targetDate),
    monthly: filterEntries(monthlyEntries, 'month', targetDate),
    yearly: filterEntries(yearlyEntries, 'year', targetDate),
  } satisfies Record<'daily' | 'monthly' | 'yearly', AggregateEntry[]>;

  const entriesForTotals =
    granularity === 'month'
      ? filteredBreakdown.monthly
      : granularity === 'year'
      ? filteredBreakdown.yearly
      : filteredBreakdown.daily;

  const filteredTotals = summarizeEntries(entriesForTotals);
  const hasFilteredMatches = entriesForTotals.length > 0;

  return NextResponse.json({
    totalBooks: hasFilteredMatches
      ? filteredTotals.bookings
      : analytics?.totalBooks ?? filteredTotals.bookings ?? 0,
    qrScans: analytics?.qrScans || 0,
    totalRevenue: hasFilteredMatches
      ? filteredTotals.revenue
      : analytics?.totalRevenue ?? filteredTotals.revenue ?? 0,
    breakdown: filteredBreakdown,
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