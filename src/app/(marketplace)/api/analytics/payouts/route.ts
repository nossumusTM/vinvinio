import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!['host', 'promoter', 'customer'].includes(currentUser.role)) {
    return new NextResponse('Not allowed', { status: 403 });
  }

  const payouts = await prisma.payout.findMany({
    where: { userId: currentUser.id, kind: 'payout' },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json(
    payouts.map((payout) => ({
      id: payout.id,
      amount: payout.amount,
      currency: payout.currency,
      status: payout.status,
      phase: payout.phase,
      period: payout.period,
      createdAt: payout.createdAt,
      processedAt: payout.processedAt,
      notes: payout.notes,
      attachmentUrl: payout.attachmentUrl,
      attachmentName: payout.attachmentName,
    })),
  );
}