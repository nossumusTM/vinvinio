import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import getCurrentUser from '@/app/actions/getCurrentUser';

export async function DELETE(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { recipientId } = await req.json();

    if (!recipientId) {
      return new NextResponse('Recipient ID is required', { status: 400 });
    }

    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: currentUser.id, recipientId },
          { senderId: recipientId, recipientId: currentUser.id },
        ],
      },
    });

    return new NextResponse('Messages deleted');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error deleting conversation messages:', message);
    return new NextResponse(JSON.stringify({ error: message }), { status: 500 });
  }
}