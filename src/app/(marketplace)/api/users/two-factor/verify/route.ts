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
      return NextResponse.json({ error: 'Two-factor code is required' }, { status: 400 });
    }

    if (!/^\d{6}$/.test(trimmedCode)) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        twoFactorTempSecret: true,
        twoFactorSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const secret = user.twoFactorTempSecret ?? user.twoFactorSecret;

    if (!secret) {
      return NextResponse.json({ error: 'Start two-factor setup first' }, { status: 400 });
    }

    const isValid = verifyTotp(trimmedCode, secret);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorTempSecret: null,
        twoFactorEnabled: true,
        twoFactorConfirmedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[two-factor/verify] error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
