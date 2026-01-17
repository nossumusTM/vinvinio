import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { addMonths, addYears, isAfter } from 'date-fns';
import { randomUUID } from 'crypto';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;

  if (!sessionId) {
    return new NextResponse('Session ID is required', { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    return new NextResponse('Payment not completed', { status: 400 });
  }

  if (session.metadata?.userId && session.metadata.userId !== currentUser.id) {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const listingId = session.metadata?.listingId;
  if (!listingId) {
    return new NextResponse('Listing information is missing', { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    return new NextResponse('Listing not found', { status: 404 });
  }

  if (!listing.vinSubscriptionEnabled) {
    return new NextResponse('VIN subscriptions are not enabled for this listing', { status: 400 });
  }

  const interval =
    session.metadata?.optionInterval === 'yearly'
      ? 'yearly'
      : session.metadata?.optionInterval === 'monthly'
        ? 'monthly'
        : listing.vinSubscriptionInterval;
  const price = Number(session.metadata?.optionPrice ?? listing.vinSubscriptionPrice ?? 0);

  if (!interval || !Number.isFinite(price) || price <= 0) {
    return new NextResponse('Subscription details are invalid', { status: 400 });
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
    return NextResponse.json(existing);
  }

  const endDate = interval === 'yearly' ? addYears(now, 1) : addMonths(now, 1);

  const subscription = await prisma.subscription.create({
    data: {
      userId: currentUser.id,
      hostId: listing.userId,
      listingId: listing.id,
      interval,
      price,
      optionId: session.metadata?.optionId || null,
      optionLabel: session.metadata?.optionLabel || null,
      optionDescription: session.metadata?.optionDescription || null,
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

  return NextResponse.json(subscription);
}