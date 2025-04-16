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
    await prisma.hostAnalytics.update({
      where: { userId: hostId },
      data: {
        totalBooks: { decrement: 1 },
        totalRevenue: { decrement: totalPrice || 0 },
      },
    });

    return NextResponse.json({ message: 'Host analytics decremented.' });
  } catch (error) {
    console.error('[HOST_ANALYTICS_DECREMENT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}