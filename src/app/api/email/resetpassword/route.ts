// app/api/email/resetpassword/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { sendResetPasswordEmail } from '../../../libs/email';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new NextResponse('Email is required', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expires,
      },
    });

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await sendResetPasswordEmail(email, resetLink);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}