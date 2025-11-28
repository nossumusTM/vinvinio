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
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'promoter') {
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
  const hasDateParam = searchParams.has('date');
  const targetDate = normalizeDateParam(searchParams.get('date'));

  const analytics = await prisma.referralAnalytics.findUnique({
    where: { userId: currentUser.id },
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

  const filteredTotals = summarizeEntries(entriesForTotals as AggregateEntry[]);
  const filteredQrScans = (entriesForTotals as AggregateEntry[]).reduce(
    (sum, entry) => sum + (entry.qrScans ?? 0),
    0,
  );

  // NEW: do we actually have anything for this filter?
  const hasFilteredEntries = (entriesForTotals as AggregateEntry[]).length > 0;

  // Only use filtered totals if there IS data for that period
  const useFilteredTotals = hasDateParam && hasFilteredEntries;

  return NextResponse.json({
    totalBooks: useFilteredTotals
      ? filteredTotals.bookings
      : analytics?.totalBooks ?? filteredTotals.bookings ?? 0,
    qrScans: useFilteredTotals
      ? filteredQrScans
      : analytics?.qrScans ?? filteredQrScans ?? 0,
    totalRevenue: useFilteredTotals
      ? filteredTotals.revenue
      : analytics?.totalRevenue ?? filteredTotals.revenue ?? 0,
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