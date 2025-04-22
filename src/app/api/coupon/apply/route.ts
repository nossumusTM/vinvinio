import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import getCurrentUser from '@/app/actions/getCurrentUser';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) return new NextResponse("Coupon code is required", { status: 400 });

    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon || new Date(coupon.expiresAt) < new Date()) {
      return new NextResponse("Invalid or expired coupon", { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        coupons: {
          connect: { id: coupon.id },
        },
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (err) {
    console.error('[COUPON_APPLY_ERROR]', err);
    return new NextResponse("Internal error", { status: 500 });
  }
}