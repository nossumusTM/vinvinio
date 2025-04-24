// /api/email/check-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) return new NextResponse('Missing email param', { status: 400 });

  try {
    const exists = await prisma.newsletter.findUnique({
      where: { email },
    });

    return NextResponse.json({ subscribed: !!exists });
  } catch (error) {
    return new NextResponse('Server error', { status: 500 });
  }
}