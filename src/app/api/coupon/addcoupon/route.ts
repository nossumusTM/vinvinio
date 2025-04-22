import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from '@/app/libs/prismadb';

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

    const alreadyUsed = await prisma.userCoupon.findFirst({
      where: {
        userId: user.id,
        couponId: coupon.id,
      },
    });

    // if (alreadyUsed) {
    //   return NextResponse.json('You have already used this coupon', { status: 400 });
    // }

    if (alreadyUsed) {
      await prisma.userCoupon.delete({
        where: { id: alreadyUsed.id }
      });
    }

    await prisma.userCoupon.create({
      data: {
        userId: user.id,
        couponId: coupon.id,
      },
    });

    // return NextResponse.json('Coupon applied successfully');
    return NextResponse.json({
      message: 'Coupon applied successfully',
      discount: coupon.discount // ✅ Make sure this is an integer (e.g. 25)
    });
  } catch (error) {
    console.error('[COUPON_ADD_ERROR]', error);
    return NextResponse.json('Internal error', { status: 500 });
  }
}