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
  const assign = body?.assign !== false;

  if (!userId) {
    return new NextResponse('A valid userId is required.', { status: 400 });
  }

  if (userId === currentUser.id) {
    return new NextResponse('Moderators cannot update themselves.', { status: 400 });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isOperator: true },
    });

    if (!existing) {
      return new NextResponse('User not found.', { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isOperator: assign },
      select: { id: true, isOperator: true, name: true, username: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('[MODERATION_USER_OPERATOR]', error);
    return new NextResponse('Failed to update operator access.', { status: 500 });
  }
}
