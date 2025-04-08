// /api/messages/system.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export async function POST(request: Request) {
  try {
    const { senderId, recipientId, text } = await request.json();

    if (!senderId || !recipientId || !text) {
      return new NextResponse('senderId, recipientId, and text are required', { status: 400 });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId,
        recipientId,
        text,
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