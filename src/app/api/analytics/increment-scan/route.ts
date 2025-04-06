// /app/api/analytics/increment-scan/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export async function POST(req: Request) {
  const body = await req.json();
  const { referenceId } = body;

  if (!referenceId) return new NextResponse('Missing referenceId', { status: 400 });

  const user = await prisma.user.findFirst({
    where: { referenceId }, // ✅ Now valid
  });

  if (!user) return new NextResponse('User not found', { status: 404 });

  // Update or create analytics
  await prisma.referralAnalytics.upsert({
    where: { userId: user.id },
    update: { qrScans: { increment: 1 } },
    create: {
      userId: user.id,
      qrScans: 1,
      totalBooks: 0,
      totalRevenue: 0,
    },
  });

  return NextResponse.json({ message: 'QR scan recorded' });
}