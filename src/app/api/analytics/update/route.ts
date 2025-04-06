// /app/api/analytics/update/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export async function POST(req: Request) {
  const body = await req.json();
  const { referenceId, totalBooksIncrement = 1, totalRevenueIncrement = 0 } = body;

  if (!referenceId) {
    return new NextResponse('Missing referenceId', { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { referenceId }
  });

  if (!user) {
    return new NextResponse('User not found', { status: 404 });
  }

  await prisma.referralAnalytics.upsert({
    where: { userId: user.id },
    update: {
      totalBooks: { increment: totalBooksIncrement },
      totalRevenue: { increment: totalRevenueIncrement },
    },
    create: {
      userId: user.id,
      totalBooks: totalBooksIncrement,
      totalRevenue: totalRevenueIncrement,
      qrScans: 0,
    }
  });

  return NextResponse.json({ message: 'Referral analytics updated' });
}