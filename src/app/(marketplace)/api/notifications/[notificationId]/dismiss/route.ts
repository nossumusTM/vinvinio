import { NextResponse } from 'next/server';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: { notificationId: string } },
) {
  const notificationId = params?.notificationId;

  if (!notificationId) {
    return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.notificationDismissal.upsert({
      where: {
        userId_notificationId: {
          userId: currentUser.id,
          notificationId,
        },
      },
      update: {
        dismissedAt: new Date(),
      },
      create: {
        userId: currentUser.id,
        notificationId,
      },
    });

    return NextResponse.json({ dismissed: true });
  } catch (error) {
    console.error('Failed to dismiss notification', error);
    return NextResponse.json({ error: 'Failed to dismiss notification' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { notificationId: string } },
) {
  const notificationId = params?.notificationId;

  if (!notificationId) {
    return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.notificationDismissal.deleteMany({
      where: {
        userId: currentUser.id,
        notificationId,
      },
    });

    return NextResponse.json({ dismissed: false });
  } catch (error) {
    console.error('Failed to restore notification', error);
    return NextResponse.json({ error: 'Failed to restore notification' }, { status: 500 });
  }
}
