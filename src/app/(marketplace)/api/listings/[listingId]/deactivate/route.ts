import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { ensureListingSlug } from '@/app/(marketplace)/libs/ensureListingSlug';

interface IParams {
  listingId?: string;
}

export async function POST(
  request: Request,
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

  const body = await request.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== 'string' || password.length === 0) {
    return new NextResponse('Password is required to deactivate a listing', { status: 400 });
  }

  const storedUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { hashedPassword: true },
  });

  if (!storedUser?.hashedPassword) {
    return new NextResponse('Password authentication is not available for this account', { status: 400 });
  }

  const isValidPassword = await bcrypt.compare(password, storedUser.hashedPassword);

  if (!isValidPassword) {
    return new NextResponse('Incorrect password. Please try again.', { status: 403 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing || listing.userId !== currentUser.id) {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  if (listing.status !== 'approved') {
    return new NextResponse('Only approved listings can be deactivated', { status: 400 });
  }

  const updatedListing = await prisma.listing.update({
    where: { id: listingId },
    data: { status: 'inactive' },
    include: { user: true },
  });

  const listingWithSlug = await ensureListingSlug(updatedListing);

  return NextResponse.json(listingWithSlug);
}
