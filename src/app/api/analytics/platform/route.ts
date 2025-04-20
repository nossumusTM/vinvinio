import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

function groupPlatformData(data: any[], type: 'daily' | 'monthly' | 'yearly') {
  const map = new Map<string, { revenue: number; platformFee: number; bookingCount: number }>();

  for (const entry of data) {
    const date = new Date(entry.createdAt);
    let key = '';

    if (type === 'daily') {
      // key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; // ✅ Uses local time
    } else if (type === 'monthly') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (type === 'yearly') {
      key = `${date.getFullYear()}`;
    }

    const current = map.get(key) || { revenue: 0, platformFee: 0, bookingCount: 0 };

    map.set(key, {
      revenue: current.revenue + entry.revenue,
      platformFee: current.platformFee + entry.platformFee,
      bookingCount: current.bookingCount + entry.bookingCount,
    });
  }

  return Array.from(map.entries()).map(([date, value]) => ({
    date,
    revenue: value.revenue,
    platformFee: value.platformFee,
    bookingCount: value.bookingCount,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function GET() {
  try {
    const data = await prisma.platformEconomy.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const daily = groupPlatformData(data, 'daily');
    const monthly = groupPlatformData(data, 'monthly');
    const yearly = groupPlatformData(data, 'yearly');

    // ✅ NEW: calculate total revenue correctly from raw data
    const totalRevenue = data.reduce((acc, cur) => acc + cur.revenue, 0);

    return NextResponse.json({ daily, monthly, yearly, totalRevenue });
  } catch (error) {
    console.error('Error fetching platform economy:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
