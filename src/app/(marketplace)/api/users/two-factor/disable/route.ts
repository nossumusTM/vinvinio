import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { verifyTotp } from '@/app/(marketplace)/utils/totp';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { code } = await request.json();
    const trimmedCode = (code as string | undefined)?.trim();

    if (!trimmedCode) {
      return NextResponse.json({ error: 'Two-factor code is required to disable protection' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: 'Two-factor authentication is not active' }, { status: 400 });
    }

    const isValid = verifyTotp(trimmedCode, user.twoFactorSecret);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorTempSecret: null,
        twoFactorConfirmedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[two-factor/disable] error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}