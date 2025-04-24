import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, type } = body;

    if (!email || !type) {
      return new NextResponse('Missing fields', { status: 400 });
    }

    await prisma.newsletter.create({
      data: { email, type },
    });

    return new NextResponse('Subscribed', { status: 200 });
  } catch (error: any) {
    console.error('[NEWSLETTER_POST]', error);

    // ✅ Avoid instanceof — use code directly
    if (error.code === 'P2002') {
      return new NextResponse('You’re already on the list! ✨', { status: 409 });
    }

    return new NextResponse('Server Error', { status: 500 });
  }
}