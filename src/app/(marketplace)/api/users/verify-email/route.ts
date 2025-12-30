// app/api/users/verify-email/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';

export async function GET(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const token = searchParams.get('token');
  
      if (!token) {
        return NextResponse.redirect(new URL('/verification/failed', req.url));
      }
  
      // 🔁 Single query to get token AND related user
      const tokenRecord = await prisma.emailVerificationToken.findFirst({
        where: { token },
        include: { user: true },
      });
  
      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        return NextResponse.redirect(new URL('/verification/expired', req.url));
      }
  
      // ✅ Update user's emailVerified field
      await prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { emailVerified: new Date() },
      });
  
      // ✅ Try-safe deletion to avoid throwing if token already gone
      try {
        await prisma.emailVerificationToken.delete({
          where: { id: tokenRecord.id },
        });
      } catch (err) {
        console.warn('[DELETE_WARNING] Token might already be deleted:', err);
      }
  
      return NextResponse.redirect(new URL('/verification/success', req.url));
    } catch (err) {
      console.error('[EMAIL_VERIFICATION_ERROR]', err);
      return NextResponse.redirect(new URL('/verification/failed', req.url));
    }
  }

export async function POST(req: Request) {
    const { token } = await req.json();
  
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
  
    const tokenRecord = await prisma.emailVerificationToken.findFirst({
      where: { token }
    });
  
    if (!tokenRecord || new Date(tokenRecord.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Token expired or invalid' }, { status: 400 });
    }
  
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerified: new Date() }
    });
  
    // ✅ Prevent P2026 error by checking token existence again
    try {
      await prisma.emailVerificationToken.delete({
        where: { id: tokenRecord.id }
      });
    } catch (err) {
      console.warn('Token already deleted or does not exist:', err);
    }
  
    return NextResponse.json({ message: 'Email verified successfully' });
  }  