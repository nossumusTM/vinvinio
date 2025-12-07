// // api/conversations/route.ts
// import { NextResponse } from 'next/server';
// export const dynamic = 'force-dynamic';

// import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
// import prisma from '@/app/(marketplace)/libs/prismadb';

// export async function GET() {
//   const currentUser = await getCurrentUser();
//   if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

//   const formatMessagePreview = (msg: any) => {
//     if (msg?.audioUrl) return '🎤 Voice message';
//     if (msg?.attachmentName) return `📎 ${msg.attachmentName}`;
//     if (msg?.text && typeof msg.text === 'string') return msg.text;
//     return 'New message';
//   };

//   try {
//     const rawMessages = await prisma.message.findMany({
//       where: {
//         OR: [
//           { senderId: currentUser.id },
//           { recipientId: currentUser.id },
//         ],
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     const messages = await Promise.all(
//       rawMessages.map(async (msg) => {
//         const [sender, recipient] = await Promise.all([
//           prisma.user.findUnique({
//             where: { id: msg.senderId },
//             select: { id: true, name: true, image: true },
//           }),
//           prisma.user.findUnique({
//             where: { id: msg.recipientId },
//             select: { id: true, name: true, image: true },
//           }),
//         ]);

//         if (!sender || !recipient) return null;

//         return { ...msg, sender, recipient };
//       })
//     );

//     // ✅ Filter out nulls using a type guard
//     const filteredMessages = messages.filter(
//       (m): m is NonNullable<typeof m> => m !== null
//     );

//     const uniqueConversations = new Map();

//     for (const msg of filteredMessages) {
//       const isIncoming = msg.recipientId === currentUser.id;
//       const otherUser = isIncoming ? msg.sender : msg.recipient;

//       if (!otherUser || otherUser.id === currentUser.id) continue;

//       const existing = uniqueConversations.get(otherUser.id);
//       const CUSTOMER_SERVICE_ID = '67ef2895f045b7ff3d0cf6fc';
//       const isUnread = isIncoming && !msg.seen;

//       if (!existing) {
//         let latestMessage = formatMessagePreview(msg);
//         let showDefaultGreeting = false;

//         if (otherUser.id === CUSTOMER_SERVICE_ID) {
//           const relatedMsgs = filteredMessages.filter(
//             (m) =>
//               (m.senderId === currentUser.id && m.recipientId === CUSTOMER_SERVICE_ID) ||
//               (m.senderId === CUSTOMER_SERVICE_ID && m.recipientId === currentUser.id)
//           );

//           const realReplies = relatedMsgs.filter(
//             (m) =>
//               m.text &&
//               !m.text.toLowerCase().includes('please specify the topic') &&
//               !m.text.toLowerCase().includes('could you please describe your issue')
//           );

//           if (realReplies.length === 0) {
//             showDefaultGreeting = true;
//             latestMessage = '🚀 Ping us anytime!';
//           }
//         }

//         uniqueConversations.set(otherUser.id, {
//           id: otherUser.id,
//           name: otherUser.name ?? 'Unknown',
//           image: otherUser.image,
//           hasUnread: isUnread,
//           latestMessage,
//           latestMessageCreatedAt: msg.createdAt,
//         });
//       } else {
//         if (isUnread) existing.hasUnread = true;
//         if (msg.createdAt > (existing.latestMessageCreatedAt || new Date(0))) {
//           existing.latestMessage = formatMessagePreview(msg);
//           existing.latestMessageCreatedAt = msg.createdAt;
//         }
//       }
//     }

//     return NextResponse.json(Array.from(uniqueConversations.values()));
//   } catch (error) {
//     console.error('❌ Error in /api/conversations:', error);
//     return NextResponse.json([], { status: 500 });
//   }
// }

// api/conversations/route.ts
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';

type MessageType = 'text' | 'attachment' | 'audio';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  const detectMessageType = (msg: any): MessageType => {
    if (msg?.audioUrl) return 'audio';
    if (msg?.attachmentUrl) return 'attachment';
    return 'text';
  };

  const formatMessagePreview = (msg: any): string => {
    const type = detectMessageType(msg);

    if (type === 'audio') {
      // Match ChatView semantics: voice note bubble with mic icon on UI
      return 'Voice note';
    }

    if (type === 'attachment') {
      if (msg?.attachmentName) return `Attachment: ${msg.attachmentName}`;
      return 'Attachment';
    }

    if (msg?.text && typeof msg.text === 'string') return msg.text;
    return 'New message';
  };

  try {
    const rawMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id },
          { recipientId: currentUser.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with sender/recipient safe data
    const messages = await Promise.all(
      rawMessages.map(async (msg) => {
        const [sender, recipient] = await Promise.all([
          prisma.user.findUnique({
            where: { id: msg.senderId },
            select: { id: true, name: true, image: true },
          }),
          prisma.user.findUnique({
            where: { id: msg.recipientId },
            select: { id: true, name: true, image: true },
          }),
        ]);

        if (!sender || !recipient) return null;

        return { ...msg, sender, recipient };
      })
    );

    const filteredMessages = messages.filter(
      (m): m is NonNullable<(typeof messages)[number]> => m !== null
    );

    const uniqueConversations = new Map<
      string,
      {
        id: string;
        name: string;
        image?: string | null;
        hasUnread: boolean;
        latestMessage: string;
        latestMessageType: MessageType;
        latestMessageCreatedAt: Date;
      }
    >();

    const CUSTOMER_SERVICE_ID = '67ef2895f045b7ff3d0cf6fc';

    for (const msg of filteredMessages) {
      const isIncoming = msg.recipientId === currentUser.id;
      const otherUser = isIncoming ? msg.sender : msg.recipient;

      if (!otherUser || otherUser.id === currentUser.id) continue;

      const existing = uniqueConversations.get(otherUser.id);
      const isUnread = isIncoming && !msg.seen;

      if (!existing) {
        const msgType = detectMessageType(msg);
        let latestMessage = formatMessagePreview(msg);
        let latestMessageType: MessageType = msgType;
        let showDefaultGreeting = false;

        // Special handling for Operator / Customer service
        if (otherUser.id === CUSTOMER_SERVICE_ID) {
          const relatedMsgs = filteredMessages.filter(
            (m) =>
              (m.senderId === currentUser.id && m.recipientId === CUSTOMER_SERVICE_ID) ||
              (m.senderId === CUSTOMER_SERVICE_ID && m.recipientId === currentUser.id)
          );

          const realReplies = relatedMsgs.filter(
            (m) =>
              m.text &&
              !m.text.toLowerCase().includes('please specify the topic') &&
              !m.text.toLowerCase().includes('could you please describe your issue')
          );

          if (realReplies.length === 0) {
            showDefaultGreeting = true;
            latestMessage = 'Ping us anytime!';
            latestMessageType = 'text';
          }
        }

        uniqueConversations.set(otherUser.id, {
          id: otherUser.id,
          name: otherUser.name ?? 'Unknown',
          image: otherUser.image,
          hasUnread: isUnread,
          latestMessage,
          latestMessageType,
          latestMessageCreatedAt: msg.createdAt,
        });
      } else {
        if (isUnread) {
          existing.hasUnread = true;
        }

        if (msg.createdAt > (existing.latestMessageCreatedAt || new Date(0))) {
          existing.latestMessage = formatMessagePreview(msg);
          existing.latestMessageType = detectMessageType(msg);
          existing.latestMessageCreatedAt = msg.createdAt;
        }
      }
    }

    return NextResponse.json(Array.from(uniqueConversations.values()));
  } catch (error) {
    console.error('❌ Error in /api/conversations:', error);
    return NextResponse.json([], { status: 500 });
  }
}