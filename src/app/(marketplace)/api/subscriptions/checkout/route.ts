// import Stripe from 'stripe';
// import { NextRequest, NextResponse } from 'next/server';

// import { BASE_CURRENCY } from '@/app/(marketplace)/constants/locale';
// import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
// import prisma from '@/app/(marketplace)/libs/prismadb';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2025-02-24.acacia',
// });

// export async function POST(req: NextRequest) {
//   const currentUser = await getCurrentUser();
//   if (!currentUser) {
//     return new NextResponse('Unauthorized', { status: 401 });
//   }

//   const { listingId } = await req.json();
//   if (!listingId || typeof listingId !== 'string') {
//     return new NextResponse('Listing ID is required', { status: 400 });
//   }

//   const listing = await prisma.listing.findUnique({
//     where: { id: listingId },
//     select: {
//       id: true,
//       title: true,
//       userId: true,
//       vinSubscriptionEnabled: true,
//       vinSubscriptionInterval: true,
//       vinSubscriptionPrice: true,
//     },
//   });

//   if (!listing) {
//     return new NextResponse('Listing not found', { status: 404 });
//   }

//   if (listing.userId === currentUser.id) {
//     return new NextResponse('Hosts cannot subscribe to their own listings', { status: 400 });
//   }

//   if (!listing.vinSubscriptionEnabled || !listing.vinSubscriptionInterval || !listing.vinSubscriptionPrice) {
//     return new NextResponse('VIN subscriptions are not enabled for this listing', { status: 400 });
//   }

//   const unitAmount = Math.round(listing.vinSubscriptionPrice * 100);
//   if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
//     return new NextResponse('Invalid subscription price', { status: 400 });
//   }

//   const intervalLabel = listing.vinSubscriptionInterval === 'yearly' ? 'Yearly' : 'Monthly';

//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       mode: 'payment',
//       line_items: [
//         {
//           price_data: {
//             currency: BASE_CURRENCY.toLowerCase(),
//             product_data: {
//               name: `${intervalLabel} VIN subscription`,
//               description: listing.title,
//             },
//             unit_amount: unitAmount,
//           },
//           quantity: 1,
//         },
//       ],
//       success_url: `${req.nextUrl.origin}/subscriptions/success?listingId=${listing.id}&session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${req.nextUrl.origin}/listings/${listing.id}`,
//       metadata: {
//         listingId: listing.id,
//         userId: currentUser.id,
//         interval: listing.vinSubscriptionInterval,
//       },
//     });

//     return NextResponse.json({ sessionId: session.id });
//   } catch (error) {
//     console.error('Stripe checkout error:', error);
//     return NextResponse.json({ error: 'Stripe checkout failed' }, { status: 500 });
//   }
// }

import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { isAfter } from 'date-fns';

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
  const selectedOption = hasOptions
    ? (listing.vinSubscriptionOptions as any[]).find((option) => option?.id === optionId)
      ?? (listing.vinSubscriptionOptions as any[])[0]
    : null;

  const interval = selectedOption?.interval ?? listing.vinSubscriptionInterval;
  const price = selectedOption?.price ?? listing.vinSubscriptionPrice;

  if (!listing.vinSubscriptionEnabled || !interval || !price) {
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

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${listing.title} - ${selectedOption?.label ?? 'VIN subscription'}`,
              description: selectedOption?.description ?? listing.vinSubscriptionTerms ?? undefined,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        listingId: listing.id,
        hostId: listing.userId,
        userId: currentUser.id,
        optionId: selectedOption?.id ?? '',
        optionLabel: selectedOption?.label ?? '',
        optionDescription: selectedOption?.description ?? '',
        optionInterval: interval,
        optionPrice: String(price),
      },
      success_url: `${req.nextUrl.origin}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/listings/${listing.id}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json({ error: 'Stripe checkout failed' }, { status: 500 });
  }
}