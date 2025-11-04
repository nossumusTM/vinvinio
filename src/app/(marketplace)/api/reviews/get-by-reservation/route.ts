import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { reservationId } = await req.json();
    if (!reservationId) return NextResponse.json(null);

    const review = await prisma.review.findUnique({
      where: { reservationId },
    });

    return NextResponse.json(review || null);
  } catch (error) {
    console.error('[GET_REVIEW_BY_RESERVATION]', error);
    return NextResponse.json(null, { status: 500 });
  }
}