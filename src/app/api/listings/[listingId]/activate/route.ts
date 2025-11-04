import { NextResponse } from 'next/server';

import getCurrentUser from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { ensureListingSlug } from '@/app/libs/ensureListingSlug';
import { toSafeListing } from '@/app/libs/serializers';

interface IParams {
  listingId?: string;
}

export async function POST(
  _request: Request,
  { params }: { params: IParams }
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const listingId = params?.listingId;

  if (!listingId || typeof listingId !== 'string') {
    return new NextResponse('Invalid listing ID', { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing || listing.userId !== currentUser.id) {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  if (listing.status !== 'inactive') {
    return new NextResponse('Only inactive listings can be reactivated', { status: 400 });
  }

  const updatedListing = await prisma.listing.update({
    where: { id: listingId },
    data: { status: 'approved' },
    include: { user: true },
  });

  const listingWithSlug = await ensureListingSlug(updatedListing);

  return NextResponse.json(toSafeListing(listingWithSlug));
}
