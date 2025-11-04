// /app/api/users/check-email/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) return new NextResponse('Missing email', { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
  });

  return NextResponse.json({ exists: !!user });
}