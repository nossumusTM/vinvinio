// /api/reviews/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/libs/prismadb';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import getCurrentUser from '@/app/actions/getCurrentUser';

export async function POST(req: Request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.error();
  
    const body = await req.json();
    const { reservationId, listingId, rating, comment } = body;
  
    if (!rating || !comment || !listingId || !reservationId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
  
    // 🔒 Check first before trying to create
    const existingReview = await prisma.review.findUnique({
      where: {
        reservationId,
      },
    });
  
    if (existingReview) {
      return NextResponse.json({ error: 'Review already exists for this reservation.' }, { status: 400 });
    }
  
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        listingId,
        reservationId,
        userId: currentUser.id,
        userName: currentUser.name ?? 'Anonymous'
      },
    });
  
    return NextResponse.json(review);
  }
  