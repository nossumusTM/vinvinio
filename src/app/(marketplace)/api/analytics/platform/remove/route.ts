import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';

export async function POST(req: Request) {
  try {
    const { reservationId } = await req.json();

    const deleted = await prisma.platformEconomy.deleteMany({
        where: { reservationId },
    });
  
    if (deleted.count === 0) {
        console.warn('[PLATFORM_ANALYTICS_REMOVE] No records found for reservationId:', reservationId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PLATFORM_ANALYTICS_REMOVE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}