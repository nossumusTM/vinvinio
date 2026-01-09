import { NextResponse } from 'next/server';
import { addMonths, addYears, isAfter } from 'date-fns';
import { randomUUID } from 'crypto';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';

export const dynamic = 'force-dynamic';

const serializeSubscription = (subscription: any) => ({
  ...subscription,
  startDate: subscription.startDate?.toISOString?.() ?? subscription.startDate,
  endDate: subscription.endDate?.toISOString?.() ?? subscription.endDate,
  createdAt: subscription.createdAt?.toISOString?.() ?? subscription.createdAt,
  updatedAt: subscription.updatedAt?.toISOString?.() ?? subscription.updatedAt,
});

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = new Date();

  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: currentUser.id,
      active: true,
      endDate: { gte: now },
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          imageSrc: true,
        },
      },
      host: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(subscriptions.map(serializeSubscription));
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const listingId = typeof body?.listingId === 'string' ? body.listingId : null;
  if (!listingId) {
    return new NextResponse('Listing ID is required', { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { user: true },
  });

  if (!listing) {
    return new NextResponse('Listing not found', { status: 404 });
  }

  if (listing.userId === currentUser.id) {
    return new NextResponse('Hosts cannot subscribe to their own listings', { status: 400 });
  }

  if (!listing.vinSubscriptionEnabled || !listing.vinSubscriptionInterval || !listing.vinSubscriptionPrice) {
    return new NextResponse('VIN subscriptions are not enabled for this listing', { status: 400 });
  }

  const now = new Date();
  const existing = await prisma.subscription.findFirst({
    where: {
      userId: currentUser.id,
      listingId: listing.id,
      active: true,
      endDate: { gte: now },
    },
  });

  if (existing && isAfter(existing.endDate, now)) {
    return NextResponse.json({ message: 'You already have an active subscription for this listing.' }, { status: 409 });
  }

  const interval = listing.vinSubscriptionInterval;
  const price = listing.vinSubscriptionPrice;
  const endDate = interval === 'yearly' ? addYears(now, 1) : addMonths(now, 1);

  const subscription = await prisma.subscription.create({
    data: {
      userId: currentUser.id,
      hostId: listing.userId,
      listingId: listing.id,
      interval,
      price,
      vinCardId: randomUUID(),
      startDate: now,
      endDate,
      active: true,
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          imageSrc: true,
        },
      },
      host: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
  });

  return NextResponse.json(serializeSubscription(subscription));
}