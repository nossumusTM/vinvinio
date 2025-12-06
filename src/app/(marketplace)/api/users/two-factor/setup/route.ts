import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { buildOtpAuthURL, createTotpSecret } from '@/app/(marketplace)/utils/totp';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { secret } = createTotpSecret();
    const label = user.email ?? user.id;
    const issuer = 'Vuola';
    const otpauthUrl = buildOtpAuthURL({ secret, label, issuer });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorTempSecret: secret,
        twoFactorSecret: null,
        twoFactorEnabled: false,
        twoFactorConfirmedAt: null,
      },
    });

    return NextResponse.json({ secret, otpauthUrl, issuer });
  } catch (error) {
    console.error('[two-factor/setup] error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}