import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';
import {
  mapToEntries,
  summarizeEntries,
  type AggregateEntry,
} from '@/app/(marketplace)/libs/aggregateTotals';

export const dynamic = 'force-dynamic';

type Granularity = 'day' | 'month' | 'year';

const normalizeDateParam = (value: string | null): Date | null => {
  if (!value) return null;

  const trimmed = String(value).trim();

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

const parsePeriodParts = (period: string) => {
  const normalized = String(period ?? '').trim();

  const dayMatch = normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (dayMatch) {
    const [, y, m, d] = dayMatch;
    return { year: Number(y), month: Number(m), day: Number(d) };
  }

  const monthMatch = normalized.match(/^(\d{4})[-/](\d{1,2})/);
  if (monthMatch) {
    const [, y, m] = monthMatch;
    return { year: Number(y), month: Number(m), day: undefined };
  }

  const yearMatch = normalized.match(/^(\d{4})/);
  if (yearMatch) {
    return { year: Number(yearMatch[1]), month: undefined, day: undefined };
  }

  const parsed = new Date(normalized.includes('T') ? normalized : `${normalized}T00:00:00Z`);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      year: parsed.getUTCFullYear(),
      month: parsed.getUTCMonth() + 1,
      day: parsed.getUTCDate(),
    };
  }

  return { year: undefined, month: undefined, day: undefined };
};

const matchesPeriod = (
  period: string,
  granularity: Granularity,
  targetDate: Date | null,
) => {
  if (!targetDate) return true;

  const { year, month, day } = parsePeriodParts(period);

  if (!Number.isFinite(year)) return false;

  const targetYear = targetDate.getUTCFullYear();
  const targetMonth = targetDate.getUTCMonth() + 1;
  const targetDay = targetDate.getUTCDate();

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

const getPromoterFromIdentifier = async (identifier: string) => {
  const filters: Prisma.UserWhereInput[] = [];

  if (isValidObjectId(identifier)) {
    filters.push({ id: identifier });
  }

  filters.push(
    { email: { equals: identifier, mode: Prisma.QueryMode.insensitive } },
    { referenceId: identifier },
  );

  return prisma.user.findFirst({
    where: {
      role: 'promoter',
      OR: filters,
    },
  });
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'promoter') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const granularityParam = searchParams.get('granularity');
    const granularity: Granularity =
      granularityParam === 'month'
        ? 'month'
        : granularityParam === 'year'
        ? 'year'
        : 'day';

    const analytics = await prisma.referralAnalytics.findUnique({
      where: { userId: user.id },
    });

    // No analytics yet for this promoter
    if (!analytics) {
      return NextResponse.json({
        userId: user.id,
        totalBooks: 0,
        qrScans: 0,
        totalRevenue: 0,
        breakdown: {
          daily: [],
          monthly: [],
          yearly: [],
        },
      });
    }

    // Convert stored buckets into AggregateEntry[]
    const dailyEntries = mapToEntries(analytics.dailyTotals);
    const monthlyEntries = mapToEntries(analytics.monthlyTotals);
    const yearlyEntries = mapToEntries(analytics.yearlyTotals);

    // Choose which bucket to use for "overall" totals based on granularity
    const entriesForTotals: AggregateEntry[] =
      granularity === 'month'
        ? monthlyEntries
        : granularity === 'year'
        ? yearlyEntries
        : dailyEntries;

    const totals = summarizeEntries(entriesForTotals);
    const qrScansTotal = entriesForTotals.reduce(
      (sum, entry) => sum + (entry.qrScans ?? 0),
      0,
    );

    const totalBooks =
      (Number.isFinite(totals.bookings) && totals.bookings > 0
        ? totals.bookings
        : Number(analytics.totalBooks ?? 0)) || 0;

    const totalRevenue =
      (Number.isFinite(totals.revenue) && totals.revenue > 0
        ? totals.revenue
        : Number(analytics.totalRevenue ?? 0)) || 0;

    const qrScans =
      (Number.isFinite(qrScansTotal) && qrScansTotal > 0
        ? qrScansTotal
        : Number(analytics.qrScans ?? 0)) || 0;

    return NextResponse.json({
      userId: user.id,
      totalBooks,
      totalRevenue,
      qrScans,
      breakdown: {
        daily: dailyEntries,
        monthly: monthlyEntries,
        yearly: yearlyEntries,
      },
    });
  } catch (error) {
    console.error('[PROMOTER_ANALYTICS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    if (!identifier) return new NextResponse('Missing identifier', { status: 400 });

    const user = await getPromoterFromIdentifier(identifier);
    if (!user) return new NextResponse('User not found', { status: 404 });

    const analytics = await prisma.referralAnalytics.findUnique({
      where: { userId: user.id },
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