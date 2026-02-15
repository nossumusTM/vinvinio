import { NextResponse } from 'next/server';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';

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
  const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
  const suspend = body?.suspend === false ? false : true;

  if (!userId) {
    return new NextResponse('A valid userId is required.', { status: 400 });
  }

  if (userId === currentUser.id) {
    return new NextResponse('Moderators cannot suspend their own account.', { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return new NextResponse('User not found.', { status: 404 });
    }

    const update = suspend
      ? { isSuspended: true, suspendedAt: new Date() }
      : { isSuspended: false, suspendedAt: null };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: update,
      select: {
        id: true,
        name: true,
        email: true,
        isSuspended: true,
        suspendedAt: true,
      },
    });

    if (suspend) {
      await prisma.listing.updateMany({
        where: {
          userId,
          status: {
            in: ['approved', 'pending', 'revision', 'awaiting_reapproval'],
          },
        },
        data: { status: 'inactive' },
      });
    }

    return NextResponse.json({
      user: {
        ...updatedUser,
        suspendedAt: updatedUser.suspendedAt?.toISOString() ?? null,
      },
      suspended: suspend,
    });
  } catch (error) {
    console.error('[MODERATION_SUSPEND_USER]', error);
    return new NextResponse('Failed to update suspension status.', { status: 500 });
  }
}
