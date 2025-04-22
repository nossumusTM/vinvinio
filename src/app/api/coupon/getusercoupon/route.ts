// import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/pages/api/auth/[...nextauth]';
// import prisma from '@/app/libs/prismadb';

// export async function GET() {
//   const session = await getServerSession(authOptions);

//   if (!session?.user?.email) {
//     return NextResponse.json('Unauthorized', { status: 401 });
//   }

//   try {
//     const user = await prisma.user.findUnique({
//       where: { email: session.user.email },
//       include: {
//         userCoupons: {
//           include: {
//             coupon: true,
//           },
//         },
//       },
//     });

//     const latestCoupon = user?.userCoupons?.[0]?.coupon;
//     if (!latestCoupon) return NextResponse.json({ code: null });

//     return NextResponse.json({ code: latestCoupon.code });
//   } catch (err) {
//     console.error('[GET_USER_COUPON_ERROR]', err);
//     return NextResponse.json('Internal error', { status: 500 });
//   }
// }

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/app/libs/prismadb';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userCoupons: {
          include: {
            coupon: true,
          },
        },
      },
    });

    const latestCoupon = user?.userCoupons?.[0]?.coupon;

    if (!latestCoupon) {
      return NextResponse.json({ code: null, discount: 0 });
    }

    return NextResponse.json({
      code: latestCoupon.code,
      discount: latestCoupon.discount,
    });
  } catch (err) {
    console.error('[GET_USER_COUPON_ERROR]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}