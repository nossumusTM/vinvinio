import { NextResponse } from 'next/server';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { ensureListingSlug } from '@/app/(marketplace)/libs/ensureListingSlug';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const listingId = typeof body?.listingId === 'string' ? body.listingId.trim() : '';

  if (!listingId) {
    return new NextResponse('A valid listingId is required.', { status: 400 });
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return new NextResponse('Listing not found.', { status: 404 });
    }

    if (listing.status === 'inactive') {
      const listingWithSlug = await ensureListingSlug(listing as any);
      return NextResponse.json({
        listing: listingWithSlug,
        alreadyInactive: true,
      });
    }

    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'inactive' },
      include: { user: true },
    });

    const listingWithSlug = await ensureListingSlug(updatedListing as any);

    return NextResponse.json({
      listing: listingWithSlug,
      alreadyInactive: false,
    });
  } catch (error) {
    console.error('[MODERATION_DEACTIVATE_LISTING]', error);
    return new NextResponse('Failed to deactivate listing.', { status: 500 });
  }
}
