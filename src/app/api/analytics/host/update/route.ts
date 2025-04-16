import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'host') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const body = await req.json();
  const { totalBooks, totalRevenue } = body;

  try {
    await prisma.hostAnalytics.upsert({
      where: { userId: currentUser.id },
      update: {
        totalBooks,
        totalRevenue,
      },
      create: {
        userId: currentUser.id,
        totalBooks,
        totalRevenue,
      },
    });

    return NextResponse.json({ message: 'Host analytics updated.' });
  } catch (error) {
    console.error('[HOST_ANALYTICS_UPDATE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
