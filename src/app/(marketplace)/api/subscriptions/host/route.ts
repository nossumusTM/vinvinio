import { NextResponse } from 'next/server';

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
  if (currentUser.role !== 'host') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const now = new Date();

  const subscriptions = await prisma.subscription.findMany({
    where: {
      hostId: currentUser.id,
      active: true,
      endDate: { gte: now },
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const payload = subscriptions.map((subscription) => {
    const { user, ...rest } = subscription as typeof subscription & { user?: unknown };
    return {
      ...serializeSubscription(rest),
      customer: user,
    };
  });

  return NextResponse.json(payload);
}