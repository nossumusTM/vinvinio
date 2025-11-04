import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from '@/app/(marketplace)/libs/prismadb';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json('Unauthorized', { status: 401 });
  }

  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json('Coupon code is required', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json('User not found', { status: 404 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon || new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Coupon not found or expired' }, { status: 400 });
    }

    const existingEntry = await prisma.userCoupon.findFirst({
      where: {
        userId: user.id,
        couponId: coupon.id,
      },
    });

    // 🚫 Coupon was already used
    if (existingEntry?.used === true) {
      return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 });
    }

    // 🟡 Coupon exists but unused (avoid duplicate insert)
    if (existingEntry && !existingEntry.used) {
      return NextResponse.json({
        message: 'Coupon already applied',
        discount: coupon.discount,
      });
    }

    // ✅ First-time applying
    await prisma.userCoupon.create({
      data: {
        userId: user.id,
        couponId: coupon.id,
        used: false,
      },
    });

    return NextResponse.json({
      message: 'Coupon applied successfully',
      discount: coupon.discount,
    });
  } catch (error) {
    console.error('[COUPON_ADD_ERROR]', error);
    return NextResponse.json('Internal error', { status: 500 });
  }
}