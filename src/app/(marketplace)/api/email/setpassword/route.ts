// app/api/email/setpassword/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Missing token or password' }, { status: 400 });
    }

    // 🕵️ Check if token exists and is valid
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!tokenRecord || tokenRecord.expires < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    // 🔐 Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 🔁 Update user's password
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { hashedPassword },
    });

    // 🧹 Delete token after successful reset
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}