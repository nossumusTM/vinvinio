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
  const optionId = typeof body?.optionId === 'string' ? body.optionId : null;
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

  const hasOptions = Array.isArray(listing.vinSubscriptionOptions) && listing.vinSubscriptionOptions.length > 0;
  if (!listing.vinSubscriptionEnabled || (!hasOptions && (!listing.vinSubscriptionInterval || !listing.vinSubscriptionPrice))) {
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

  const selectedOption = hasOptions
    ? (listing.vinSubscriptionOptions as any[]).find((option) => option?.id === optionId)
      ?? (listing.vinSubscriptionOptions as any[])[0]
    : null;

  const interval = selectedOption?.interval ?? listing.vinSubscriptionInterval;
  const price = selectedOption?.price ?? listing.vinSubscriptionPrice;

  if (!interval || !price) {
    return new NextResponse('VIN subscription plan is invalid', { status: 400 });
  }
  const endDate = interval === 'yearly' ? addYears(now, 1) : addMonths(now, 1);

  const subscription = await prisma.subscription.create({
    data: {
      interval,
      price,

      // required relations
      user: { connect: { id: currentUser.id } },
      host: { connect: { id: listing.userId } },     // host is listing owner
      listing: { connect: { id: listing.id } },

      // optional option metadata (keep if your schema has these)
      optionId: selectedOption?.id ?? null,
      optionLabel: selectedOption?.label ?? null,
      optionDescription: selectedOption?.description ?? null,

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