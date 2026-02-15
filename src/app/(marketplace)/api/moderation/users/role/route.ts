import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES: Role[] = ['customer', 'host', 'promoter'];

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
  const targetRole = typeof body?.targetRole === 'string' ? body.targetRole.trim() : '';

  if (!userId) {
    return new NextResponse('A valid userId is required.', { status: 400 });
  }

  if (!targetRole) {
    return new NextResponse('A target role is required.', { status: 400 });
  }

  if (!ALLOWED_ROLES.includes(targetRole as Role)) {
    return new NextResponse('Role not supported.', { status: 400 });
  }

  if (userId === currentUser.id) {
    return new NextResponse('Moderators cannot change their own role.', { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, alternateRole: true },
    });

    if (!user) {
      return new NextResponse('User not found.', { status: 404 });
    }

    if (user.role === targetRole) {
      return NextResponse.json({
        user: {
          id: user.id,
          role: user.role,
          alternateRole: user.alternateRole ?? null,
        },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: targetRole as Role,
        alternateRole: user.role,
      },
      select: {
        id: true,
        role: true,
        alternateRole: true,
      },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        alternateRole: updatedUser.alternateRole ?? null,
      },
    });
  } catch (error) {
    console.error('[MODERATION_USER_ROLE]', error);
    return new NextResponse('Failed to update user role.', { status: 500 });
  }
}
