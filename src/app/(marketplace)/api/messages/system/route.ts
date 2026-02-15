// /api/messages/system.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';

const CUSTOMER_SERVICE_ID = '67ef2895f045b7ff3d0cf6fc';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { senderId, recipientId, text } = await request.json();

    if (!senderId || !recipientId || !text) {
      return new NextResponse('senderId, recipientId, and text are required', { status: 400 });
    }

    const sender = String(senderId).trim();
    const recipient = String(recipientId).trim();
    const bodyText = String(text).trim();

    if (!sender || !recipient || !bodyText) {
      return new NextResponse('Invalid senderId, recipientId, or text', { status: 400 });
    }

    const isSameUserSender = sender === currentUser.id;
    const isSafeSupportEcho =
      sender === CUSTOMER_SERVICE_ID &&
      recipient === currentUser.id;

    if (!isSameUserSender && !isSafeSupportEcho) {
      return new NextResponse('Forbidden sender identity', { status: 403 });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: sender,
        recipientId: recipient,
        text: bodyText,
        seen: false,
      },
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('System message error:', message);
    return new NextResponse(JSON.stringify({ error: message }), { status: 500 });
  }
}
