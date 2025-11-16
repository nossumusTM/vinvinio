import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/app/(marketplace)/libs/prismadb';
import {
  checkVerificationCode,
  isTwilioConfigured,
} from '@/app/(marketplace)/libs/twilioVerify';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isTwilioConfigured()) {
    return NextResponse.json({ error: 'Phone verification unavailable' }, { status: 503 });
  }

  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, phone: true, phoneVerified: true },
    });

    if (!user || !user.phone) {
      return NextResponse.json({ error: 'Phone number missing' }, { status: 400 });
    }

    if (user.phoneVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    const result = await checkVerificationCode(user.phone, code.trim());

    if (result.status !== 'approved') {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true },
      select: {
        id: true,
        phoneVerified: true,
      },
    });

    console.info('[phone-verification] Phone verified for user', user.id);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error verifying phone number:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}