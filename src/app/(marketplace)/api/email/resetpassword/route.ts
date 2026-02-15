// app/api/email/resetpassword/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { sendResetPasswordEmail } from '../../../libs/email';
import crypto from 'crypto';

const hashResetToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      return new NextResponse('Email is required', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Avoid leaking whether an account exists for this email.
      return NextResponse.json({ success: true });
    }

    // Keep only one active reset token per user.
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashResetToken(token);
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expires,
      },
    });

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await sendResetPasswordEmail(normalizedEmail, resetLink);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
