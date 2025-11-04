// app/api/email/confirmreset/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const { token, newPassword, confirmPassword } = await req.json();

    if (!token || !newPassword || newPassword !== confirmPassword) {
      return new NextResponse('Invalid data', { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return new NextResponse('Token invalid or expired', { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return new NextResponse('Internal Error', { status: 500 });
  }
}