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
import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';

type RawEarning = {
  amount: number;
  totalBooks: number;
  createdAt: Date;
  partnerCommission?: number;
  punti?: number;
  puntiShare?: number;
  puntiLabel?: string;
};

function groupByDate(data: RawEarning[], type: 'daily' | 'monthly' | 'yearly') {
  const map = new Map<string, { amount: number; totalBooks: number, partnerCommission?: number, punti?: number, puntiShare?: number, puntiLabel?: string }>();

  data.forEach(entry => {
    const date = new Date(entry.createdAt);
    let key = '';

    if (type === 'daily') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else if (type === 'monthly') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (type === 'yearly') {
      key = `${date.getFullYear()}`;
    }

    const existing = map.get(key) || { amount: 0, totalBooks: 0 };
    map.set(key, {
      amount: existing.amount + entry.amount,
      totalBooks: existing.totalBooks + entry.totalBooks,
    });
  });

  return Array.from(map.entries()).map(([date, { amount, totalBooks }]) => ({
    date,
    amount,
    books: totalBooks,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const earningsRaw = await prisma.earning.findMany({
    where: { userId: currentUser.id },
    orderBy: { createdAt: 'asc' },
    select: {
      amount: true,
      totalBooks: true,
      createdAt: true,
    },
  });

  // Fix null totalBooks by setting 0 if missing
  const earnings: RawEarning[] = earningsRaw.map(entry => ({
    amount: entry.amount,
    totalBooks: entry.totalBooks ?? 0,
    createdAt: entry.createdAt,
  }));

  const daily = groupByDate(earnings, 'daily');
  const monthly = groupByDate(earnings, 'monthly');
  const yearly = groupByDate(earnings, 'yearly');

  const totalEarnings = earnings.reduce((sum, entry) => sum + entry.amount, 0);
  const totalBooks = earnings.reduce((sum, entry) => sum + entry.totalBooks, 0);

  return NextResponse.json({
    daily,
    monthly,
    yearly,
    totalEarnings,
    totalBooks,
  });
}