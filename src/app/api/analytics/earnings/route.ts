import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import getCurrentUser from '@/app/actions/getCurrentUser';

type RawEarning = {
  amount: number;
  createdAt: Date;
};

function groupByDate(data: RawEarning[], type: 'daily' | 'monthly' | 'yearly') {
  const map = new Map<string, number>();

  data.forEach(entry => {
    const date = new Date(entry.createdAt);
    let key = '';

    if (type === 'daily') {
      key = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    } else if (type === 'monthly') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // 'YYYY-MM'
    } else if (type === 'yearly') {
      key = `${date.getFullYear()}`;
    }

    map.set(key, (map.get(key) || 0) + entry.amount);
  });

  return Array.from(map.entries()).map(([date, amount]) => ({
    date,
    amount,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const earnings = await prisma.earning.findMany({
    where: { userId: currentUser.id },
    orderBy: { createdAt: 'asc' },
  });

  const daily = groupByDate(earnings, 'daily');
  const monthly = groupByDate(earnings, 'monthly');
  const yearly = groupByDate(earnings, 'yearly');

  const totalEarnings = earnings.reduce((sum, entry) => sum + entry.amount, 0);

  return NextResponse.json({
    daily,
    monthly,
    yearly,
    totalEarnings,
  });
}
