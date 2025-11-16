import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { checkVerificationCode, isTwilioConfigured } from '@/app/(marketplace)/libs/twilioVerify';

export async function POST(request: Request) {
  if (!isTwilioConfigured()) {
    return NextResponse.json({ error: 'Phone recovery unavailable' }, { status: 503 });
  }

  try {
    const { phone, code, newPassword } = await request.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }

    const sanitizedPhone = phone.trim();

    const user = await prisma.user.findFirst({
      where: { phone: sanitizedPhone },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'No user found for this phone number' }, { status: 404 });
    }

    const verification = await checkVerificationCode(sanitizedPhone, code.trim());

    if (verification.status !== 'approved') {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        passwordUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[password-reset][phone][confirm]', error);
    return NextResponse.json({ error: 'Unable to update password' }, { status: 500 });
  }
}