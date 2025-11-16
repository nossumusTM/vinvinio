import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { isTwilioConfigured, sendVerificationCode } from '@/app/(marketplace)/libs/twilioVerify';

export async function POST(request: Request) {
  if (!isTwilioConfigured()) {
    return NextResponse.json({ error: 'Phone recovery unavailable' }, { status: 503 });
  }

  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const sanitizedPhone = phone.trim();

    const user = await prisma.user.findFirst({
      where: { phone: sanitizedPhone },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'No user found for this phone number' }, { status: 404 });
    }

    await sendVerificationCode(sanitizedPhone);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[password-reset][phone][request]', error);
    return NextResponse.json({ error: 'Unable to start SMS reset' }, { status: 500 });
  }
}