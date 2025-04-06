// /api/reviews/get-by-listing/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export async function POST(req: Request) {
  try {
    const { listingId } = await req.json();

    if (!listingId) return NextResponse.json([]);

    const reviews = await prisma.review.findMany({
      where: { listingId },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = reviews.map((r: any) => ({
      rating: r.rating,
      comment: r.comment,
      userName: r.user?.name || 'Anonymous',
      createdAt: r.createdAt || ''
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[GET_LISTING_REVIEWS]', error);
    return NextResponse.json([]);
  }
}