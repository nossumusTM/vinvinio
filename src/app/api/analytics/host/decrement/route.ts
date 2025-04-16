import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import getCurrentUser from '@/app/actions/getCurrentUser';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || (currentUser.role !== 'host' && currentUser.role !== 'moder')) {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const { hostId, totalPrice } = await req.json();

  if (!hostId) {
    return new NextResponse('Missing hostId', { status: 400 });
  }

  try {
    // Get current values to prevent negative numbers
    const current = await prisma.hostAnalytics.findUnique({
      where: { userId: hostId },
    });

    const newBooks = Math.max(0, (current?.totalBooks || 0) - 1);
    const newRevenue = Math.max(0, (current?.totalRevenue || 0) - (totalPrice || 0));

    await prisma.hostAnalytics.upsert({
      where: { userId: hostId },
      update: {
        totalBooks: newBooks,
        totalRevenue: newRevenue,
      },
      create: {
        userId: hostId,
        totalBooks: 0,
        totalRevenue: 0,
      },
    });

    return NextResponse.json({ message: 'Host analytics decremented.' });
  } catch (error) {
    console.error('[HOST_ANALYTICS_DECREMENT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}