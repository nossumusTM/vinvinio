import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ valid: false });
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    const isExpired = !record || new Date(record.expires) < new Date();

    return NextResponse.json({ valid: !isExpired });
  } catch (error) {
    console.error('[RESET TOKEN VALIDATION ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}