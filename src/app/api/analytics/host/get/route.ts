import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'host') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  try {
    const analytics = await prisma.hostAnalytics.findUnique({
      where: { userId: currentUser.id },
    });

    return NextResponse.json({
      totalBooks: analytics?.totalBooks || 0,
      totalRevenue: analytics?.totalRevenue || 0,
    });
  } catch (error) {
    console.error('[HOST_ANALYTICS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
