import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { dropLegacyUniqueUserIndex } from '@/app/(marketplace)/libs/payoutIndexes';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import { BASE_CURRENCY } from '@/app/(marketplace)/constants/locale';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { userId, amount, currency, period, phase, note, attachmentUrl, attachmentName } = body ?? {};

  if (!userId || amount == null) {
    return new NextResponse('Missing userId or amount', { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.role !== 'host') {
    return new NextResponse('User not found or not a host', { status: 404 });
  }

  const payoutMethod = await prisma.payout.findFirst({
    where: { userId, kind: 'method' },
    orderBy: { createdAt: 'desc' },
  });

  const phaseNumber = Number.isFinite(Number(phase)) ? Number(phase) : new Date().getUTCDate() <= 15 ? 1 : 2;
  const periodKey = typeof period === 'string' && period.length >= 7 ? period.slice(0, 7) : new Date().toISOString().slice(0, 7);

  await dropLegacyUniqueUserIndex();

  const record = await prisma.payout.create({
    data: {
      userId,
      method: payoutMethod?.method ?? 'payout',
      value: payoutMethod?.value ?? 'payout_record',
      kind: 'payout',
      username: user.username ?? undefined,
      email: user.email ?? undefined,
      amount: Number(amount),
      currency: currency ?? payoutMethod?.currency ?? BASE_CURRENCY,
      status: 'payout_received',
      phase: phaseNumber,
      period: periodKey,
      processedAt: new Date(),
      notes: typeof note === 'string' && note.trim() ? note.trim() : 'Moderator-triggered host payout',
      attachmentUrl: typeof attachmentUrl === 'string' && attachmentUrl.trim() ? attachmentUrl.trim() : undefined,
      attachmentName: typeof attachmentName === 'string' && attachmentName.trim() ? attachmentName.trim() : undefined,
    },
  });

  return NextResponse.json({ message: 'Payout marked as sent for host', payout: record });
}
