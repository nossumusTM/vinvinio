// /app/api/analytics/remove-reservation/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
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