// pages/api/messages/mark-seen/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
 import getCurrentUser from  '@/app/(marketplace)/actions/getCurrentUser';

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => null);
  const senderId = typeof body?.senderId === 'string' ? body.senderId : '';
  const operatorRequestId =
    typeof body?.operatorRequestId === 'string' ? body.operatorRequestId.trim() : '';

  if (!senderId && !operatorRequestId) {
    return new NextResponse('Sender ID or operatorRequestId required', { status: 400 });
  }

  try {
    if (operatorRequestId) {
      await prisma.message.updateMany({
        where: {
          operatorRequestId,
          recipientId: currentUser.id,
          seen: false,
        },
        data: {
          seen: true,
        },
      });
    } else {
      await prisma.message.updateMany({
        where: {
          senderId,
          recipientId: currentUser.id,
          seen: false,
        },
        data: {
          seen: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Mark seen error:', err);
    return new NextResponse('Error marking messages seen', { status: 500 });
  }
}
