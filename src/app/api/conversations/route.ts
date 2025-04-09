
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import getCurrentUser from  '@/app/actions/getCurrentUser';
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

    const uniqueUsersMap = new Map();

    messages.forEach((msg: any) => {
      const isIncoming = msg.recipientId === currentUser.id;
      const otherUser = isIncoming ? msg.sender : msg.recipient;

      if (!otherUser || otherUser.id === currentUser.id || !otherUser.name) return;

      const existing = uniqueUsersMap.get(otherUser.id);
      const CUSTOMER_SERVICE_ID = '67ef2895f045b7ff3d0cf6fc';
      const isUnread = isIncoming && !msg.seen;
      // const isUnread = isIncoming && !msg.seen && msg.senderId !== CUSTOMER_SERVICE_ID;

      if (!existing) {
        const isCustomerService = otherUser.id === CUSTOMER_SERVICE_ID;
      
        let showDefaultGreeting = false;
      
        if (isCustomerService) {
          const relatedMessages = messages.filter(
            (m: any) =>
              (m.senderId === currentUser.id && m.recipientId === CUSTOMER_SERVICE_ID) ||
              (m.senderId === CUSTOMER_SERVICE_ID && m.recipientId === currentUser.id)
          );
      
          const realReplies = relatedMessages.filter(
            (m: any) =>
              !m.text.toLowerCase().includes('please specify the topic') &&
              !m.text.toLowerCase().includes('could you please describe your issue')
          );
      
          if (realReplies.length === 0) {
            showDefaultGreeting = true;
          }
        }
      
        uniqueUsersMap.set(otherUser.id, {
          id: otherUser.id,
          name: otherUser.name ?? 'Unknown',
          image: otherUser.image,
          hasUnread: isUnread,
          latestMessage: showDefaultGreeting ? 'How can we help you?' : msg.text,
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

    const result = Array.from(uniqueUsersMap.values());

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error in /api/conversations:', error);
    // return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    return NextResponse.json([], { status: 500 });
  }
}