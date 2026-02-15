// /app/api/analytics/remove-reservation/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Not Found', { status: 404 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'moder') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { reservationId } = await req.json();

    if (!reservationId) {
      return new NextResponse("Missing reservationId", { status: 400 });
    }

    // 🧹 Remove from Earnings table
    await prisma.earning.deleteMany({
      where: { reservationId }
    });

    // 🧹 Remove from Platform Economy table
    await prisma.platformEconomy.deleteMany({
      where: { reservationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ANALYTICS_REMOVE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
