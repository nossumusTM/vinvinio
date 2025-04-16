import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'host') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const { totalPrice } = await req.json(); // expects totalPrice from reservation

  try {
    // Ensure HostAnalytics exists for this host
    await prisma.hostAnalytics.upsert({
      where: { userId: currentUser.id },
      update: {
        totalBooks: { increment: 1 },
        totalRevenue: { increment: totalPrice || 0 },
      },
      create: {
        userId: currentUser.id,
        totalBooks: 1,
        totalRevenue: totalPrice || 0,
      },
    });

    return NextResponse.json({ message: 'Host analytics incremented.' });
  } catch (error) {
    console.error('[HOST_ANALYTICS_INCREMENT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
