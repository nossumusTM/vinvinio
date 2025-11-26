// // /api/analytics/earnings/route.ts
// import { NextResponse } from 'next/server';
// import prisma from '@/app/libs/prismadb';
// import getCurrentUser from '@/app/actions/getCurrentUser';

// type RawEarning = {
//   amount: number;
//   createdAt: Date;
// };

// function groupByDate(data: RawEarning[], type: 'daily' | 'monthly' | 'yearly') {
//   const map = new Map<string, number>();

//   data.forEach(entry => {
//     const date = new Date(entry.createdAt);
//     let key = '';

//     if (type === 'daily') {
//       // key = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
//       key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
//     } else if (type === 'monthly') {
//       key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // 'YYYY-MM'
//     } else if (type === 'yearly') {
//       key = `${date.getFullYear()}`;
//     }

//     map.set(key, (map.get(key) || 0) + entry.amount);
//   });

//   return Array.from(map.entries()).map(([date, amount]) => ({
//     date,
//     amount,
//   })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
// }

// export async function GET() {
//   const currentUser = await getCurrentUser();
//   if (!currentUser?.id) {
//     return new NextResponse("Unauthorized", { status: 401 });
//   }

//   const earnings = await prisma.earning.findMany({
//     where: { userId: currentUser.id },
//     orderBy: { createdAt: 'asc' },
//   });

//   const daily = groupByDate(earnings, 'daily');
//   const monthly = groupByDate(earnings, 'monthly');
//   const yearly = groupByDate(earnings, 'yearly');

//   const totalEarnings = earnings.reduce((sum, entry) => sum + entry.amount, 0);

//   return NextResponse.json({
//     daily,
//     monthly,
//     yearly,
//     totalEarnings,
//   });
// }

// /api/analytics/earnings/route.ts
// /api/analytics/earnings/route.ts
// /api/analytics/earnings/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import { mapToEntries } from '@/app/(marketplace)/libs/aggregateTotals';
import { BASE_CURRENCY } from '@/app/(marketplace)/constants/locale';
import {
  computeHostShareFromCommission,
  MIN_PARTNER_COMMISSION,
} from '@/app/(marketplace)/constants/partner';

type RawEarning = {
  amount: number;
  totalBooks: number;
  createdAt: Date;
};

const parseJsonMaybe = (raw: unknown) => {
  if (typeof raw !== 'string') return raw;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[EARNINGS_PARSE_FAILED]', { error, raw });
    return raw;
  }
};

function groupByDate(
  data: RawEarning[],
  type: 'daily' | 'monthly' | 'yearly',
) {
  const map = new Map<
    string,
    { amount: number; totalBooks: number }
  >();

  data.forEach((entry) => {
    const date = new Date(entry.createdAt);
    let key = '';

    if (type === 'daily') {
      key = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else if (type === 'monthly') {
      key = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}`;
    } else if (type === 'yearly') {
      key = `${date.getFullYear()}`;
    }

    const existing = map.get(key) || { amount: 0, totalBooks: 0 };
    map.set(key, {
      amount: existing.amount + entry.amount,
      totalBooks: existing.totalBooks + entry.totalBooks,
    });
  });

  return Array.from(map.entries())
    .map(([date, { amount, totalBooks }]) => ({
      date,
      amount,
      books: totalBooks,
    }))
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
}

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 🔢 derive partnerCommission & hostShare from *User*, not HostAnalytics
  const partnerCommission =
    currentUser.role === 'host'
      ? currentUser.partnerCommission ?? MIN_PARTNER_COMMISSION
      : null;

  const hostShare =
    partnerCommission != null
      ? computeHostShareFromCommission(partnerCommission)
      : null;

  const [earningsRaw, hostAnalytics] = await Promise.all([
    prisma.earning.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: 'asc' },
      select: {
        amount: true,
        totalBooks: true,
        createdAt: true,
      },
    }),
    currentUser.role === 'host'
      ? prisma.hostAnalytics.findUnique({
          where: { userId: currentUser.id },
          select: {
            totalRevenue: true,
            totalBooks: true,
            dailyTotals: true,
            monthlyTotals: true,
            yearlyTotals: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : null,
  ]);

  // normalise missing totalBooks to 0
  const earnings: RawEarning[] = earningsRaw.map((entry) => ({
    amount: entry.amount,
    totalBooks: entry.totalBooks ?? 0,
    createdAt: entry.createdAt,
  }));

  // hostAnalytics fallback (for older hosts with no ledger entries)
  const hostDaily = mapToEntries(
    parseJsonMaybe(hostAnalytics?.dailyTotals),
  ).map(({ period, revenue, bookings }) => ({
    date: period,
    amount: revenue,
    books: bookings,
  }));

  const hostMonthly = mapToEntries(
    parseJsonMaybe(hostAnalytics?.monthlyTotals),
  ).map(({ period, revenue, bookings }) => ({
    date: period,
    amount: revenue,
    books: bookings,
  }));

  const hostYearly = mapToEntries(
    parseJsonMaybe(hostAnalytics?.yearlyTotals),
  ).map(({ period, revenue, bookings }) => ({
    date: period,
    amount: revenue,
    books: bookings,
  }));

  // if hostAnalytics has only aggregate totals, synthesise a single anchor entry
  if (!hostDaily.length && !hostMonthly.length && !hostYearly.length) {
    const anchorDate =
      hostAnalytics?.updatedAt ?? hostAnalytics?.createdAt;
    const hasTotals =
      typeof hostAnalytics?.totalRevenue === 'number' ||
      typeof hostAnalytics?.totalBooks === 'number';

    if (anchorDate && hasTotals) {
      const year = anchorDate.getUTCFullYear();
      const month = String(
        anchorDate.getUTCMonth() + 1,
      ).padStart(2, '0');
      const day = String(anchorDate.getUTCDate()).padStart(2, '0');

      const revenue = Number(hostAnalytics?.totalRevenue ?? 0);
      const bookings = Number(hostAnalytics?.totalBooks ?? 0);

      const base = {
        date: `${year}-${month}-${day}`,
        amount: revenue,
        books: bookings,
      };

      hostDaily.push(base);
      hostMonthly.push({ ...base, date: `${year}-${month}` });
      hostYearly.push({ ...base, date: `${year}` });
    }
  }

  const hasLedgerEarnings = earnings.length > 0;

  const normalizeEntries = (entries: {
    date: string;
    amount: number;
    books?: number;
  }[]) =>
    entries.map((entry) => ({
      date: entry.date,
      amount: Number(entry.amount ?? 0),
      books: Number(entry.books ?? 0),
    }));

  const daily = normalizeEntries(
    hasLedgerEarnings ? groupByDate(earnings, 'daily') : hostDaily,
  );
  const monthly = normalizeEntries(
    hasLedgerEarnings ? groupByDate(earnings, 'monthly') : hostMonthly,
  );
  const yearly = normalizeEntries(
    hasLedgerEarnings ? groupByDate(earnings, 'yearly') : hostYearly,
  );

  // NOTE: `earnings.amount` is whatever you've stored in Earning
  // (platform gross or user share) — don't multiply by hostShare here
  const totalEarnings = hasLedgerEarnings
    ? earnings.reduce((sum, entry) => sum + entry.amount, 0)
    : Number(hostAnalytics?.totalRevenue ?? 0);

  const totalBooks = hasLedgerEarnings
    ? earnings.reduce((sum, entry) => sum + entry.totalBooks, 0)
    : Number(hostAnalytics?.totalBooks ?? 0);

  const sumAmounts = (entries: { amount: number }[]) =>
    entries.reduce((sum, entry) => sum + entry.amount, 0);

  const revenueTotals = {
    daily: sumAmounts(daily),
    monthly: sumAmounts(monthly),
    yearly: sumAmounts(yearly),
    all: totalEarnings,
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysProfit =
    daily.find((entry) => entry.date === todayKey)?.amount ?? 0;

  return NextResponse.json({
    daily,
    monthly,
    yearly,
    totalEarnings,
    totalBooks,
    currency: BASE_CURRENCY,
    revenueTotals,
    todaysProfit,
    // 👇 new fields for the frontend
    partnerCommission,
    hostShare,
  });
}
