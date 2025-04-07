// pages/api/messages/mark-seen/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
 import getCurrentUser from  '@/app/actions/getCurrentUser';

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  const { senderId } = await req.json();
  if (!senderId) return new NextResponse('Sender ID required', { status: 400 });

  try {
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Mark seen error:', err);
    return new NextResponse('Error marking messages seen', { status: 500 });
  }
}