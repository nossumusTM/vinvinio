// /api/email/profile-newsletter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return new NextResponse('Missing email', { status: 400 });

    await prisma.newsletter.create({
      data: { email, type: 'experience' },
    });

    return NextResponse.json({ message: 'Subscribed' });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new NextResponse('Already subscribed', { status: 409 });
    }

    return new NextResponse('Server error', { status: 500 });
  }
}

// export async function DELETE(req: NextRequest) {
//   try {
//     const { email } = await req.json();
//     if (!email) return new NextResponse('Missing email', { status: 400 });

//     await prisma.newsletter.delete({
//       where: { email },
//     });

//     return NextResponse.json({ message: 'Unsubscribed' });
//   } catch (error) {
//     return new NextResponse('Server error', { status: 500 });
//   }
// }

export async function DELETE(req: NextRequest) {
  try {
    const { email, type } = await req.json();

    if (!email || !type) {
      return new NextResponse('Missing fields', { status: 400 });
    }

    await prisma.newsletter.delete({
      where: {
        email_type: {
          email,
          type,
        },
      },
    });

    return NextResponse.json({ message: 'Unsubscribed' });
  } catch (error) {
    console.error('[DELETE_SUBSCRIPTION_ERROR]', error);
    return new NextResponse('Server error', { status: 500 });
  }
}