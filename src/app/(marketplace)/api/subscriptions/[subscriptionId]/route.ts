import { NextResponse } from 'next/server';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';

interface Params {
  subscriptionId?: string;
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const subscriptionId = params?.subscriptionId;
  if (!subscriptionId || typeof subscriptionId !== 'string') {
    return new NextResponse('Invalid subscription ID', { status: 400 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    return new NextResponse('Subscription not found', { status: 404 });
  }

  if (subscription.userId !== currentUser.id && subscription.hostId !== currentUser.id) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const now = new Date();
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      active: false,
      endDate: now,
      updatedAt: now,
    },
  });

  return NextResponse.json(updated);
}