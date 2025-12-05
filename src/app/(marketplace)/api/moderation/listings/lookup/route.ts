import { NextResponse } from 'next/server';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { findUserIdByHandle } from '@/app/(marketplace)/libs/userHandles';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const listingId = (searchParams.get('listingId') ?? '').trim();
  const identifier = (searchParams.get('identifier') ?? '').trim();

  if (!listingId && !identifier) {
    return new NextResponse('Provide a listingId or username.', { status: 400 });
  }

  try {
    let userId: string | null = null;

    if (!listingId && identifier) {
      userId = await findUserIdByHandle(identifier);
      if (!userId) {
        return new NextResponse('User not found.', { status: 404 });
      }
    }

    const listings = await prisma.listing.findMany({
      where: {
        ...(listingId ? { id: listingId } : {}),
        ...(userId ? { userId } : {}),
      },
      include: {
        user: true,
      },
    });

    if (!listings.length) {
      return new NextResponse('No listings found.', { status: 404 });
    }

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('[MODER_LISTING_LOOKUP]', error);
    return new NextResponse('Failed to fetch listings.', { status: 500 });
  }
}