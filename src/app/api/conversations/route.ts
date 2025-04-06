import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id },
          { recipientId: currentUser.id },
        ],
      },
      include: {
        sender: true,
        recipient: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const uniqueUsers = new Map<
      string,
      {
        id: string;
        name: string;
        image?: string | null;
        hasUnread: boolean;
        latestMessage?: string;
        latestMessageCreatedAt?: Date;
      }
    >();

    messages.forEach((msg) => {
      const isIncoming = msg.recipientId === currentUser.id;
      const otherUser = isIncoming ? msg.sender : msg.recipient;

      if (!otherUser || otherUser.id === currentUser.id || !otherUser.name) return;

      const existing = uniqueUsers.get(otherUser.id);
      const isUnread = isIncoming && !msg.seen;

      if (!existing) {
        uniqueUsers.set(otherUser.id, {
          id: otherUser.id,
          name: otherUser.name ?? 'Unknown',
          image: otherUser.image,
          hasUnread: isUnread,
          latestMessage: msg.text,
          latestMessageCreatedAt: msg.createdAt,
        });
      } else {
        if (isUnread) existing.hasUnread = true;
        if (msg.createdAt > (existing.latestMessageCreatedAt || new Date(0))) {
          existing.latestMessage = msg.text;
          existing.latestMessageCreatedAt = msg.createdAt;
        }
      }

    });

    // return NextResponse.json(
    //   Array.from(uniqueUsers.values()).map(({ latestMessageCreatedAt, ...rest }) => rest)
    // );
    return NextResponse.json(Array.from(uniqueUsers.values()));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
