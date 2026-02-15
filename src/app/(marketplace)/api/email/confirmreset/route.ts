// app/api/email/confirmreset/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const hashResetToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export async function POST(req: Request) {
  try {
    const { token, newPassword, confirmPassword } = await req.json();

    if (!token || !newPassword || newPassword !== confirmPassword) {
      return new NextResponse('Invalid data', { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return new NextResponse('Password must be at least 8 characters.', { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashResetToken(token) },
      include: { user: true },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return new NextResponse('Token invalid or expired', { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        hashedPassword,
        passwordUpdatedAt: new Date(),
      },
    });

    await prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
