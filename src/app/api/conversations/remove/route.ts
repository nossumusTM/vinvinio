// /api/conversations/remove/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
 import getCurrentUser from  '@/app/actions/getCurrentUser';
export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { recipientId } = await request.json();
    if (!recipientId) return new NextResponse('Recipient ID is required', { status: 400 });

    if (recipientId === '67ef2895f045b7ff3d0cf6fc') {
      return new NextResponse('Cannot remove Customer Service', { status: 403 });
    }

    // Delete all messages between the current user and the recipient
    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: currentUser.id, recipientId },
          { senderId: recipientId, recipientId: currentUser.id },
        ],
      },
    });

    // Optionally: store conversation as removed (if you want to prevent reappearing on next message)
    await prisma.removedConversation.create({
      data: {
        removerId: currentUser.id,
        removedId: recipientId,
      },
    });

    return new NextResponse('Conversation removed', { status: 200 });
  } catch (error) {
    console.error('Error removing conversation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
