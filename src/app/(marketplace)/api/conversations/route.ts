
// import { NextResponse } from 'next/server';
// export const dynamic = 'force-dynamic';
// import getCurrentUser from  '@/app/actions/getCurrentUser';
// import prisma from '@/app/libs/prismadb';

// export async function GET() {
//   const currentUser = await getCurrentUser();
//   if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

//   try {
//     const messages = await prisma.message.findMany({
//       where: {
//         OR: [
//           { senderId: currentUser.id },
//           { recipientId: currentUser.id },
//         ],
//       },
//       include: {
//         sender: true,
//         recipient: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     const uniqueUsersMap = new Map();

//     messages.forEach((msg: any) => {
//       const isIncoming = msg.recipientId === currentUser.id;
//       const otherUser = isIncoming ? msg.sender : msg.recipient;

//       if (!otherUser || otherUser.id === currentUser.id || !otherUser.name) return;

//       const existing = uniqueUsersMap.get(otherUser.id);
//       const CUSTOMER_SERVICE_ID = '67ef2895f045b7ff3d0cf6fc';
//       const isUnread = isIncoming && !msg.seen;
//       // const isUnread = isIncoming && !msg.seen && msg.senderId !== CUSTOMER_SERVICE_ID;

//       if (!existing) {
//         const isCustomerService = otherUser.id === CUSTOMER_SERVICE_ID;
      
//         let showDefaultGreeting = false;
      
//         if (isCustomerService) {
//           const relatedMessages = messages.filter(
//             (m: any) =>
//               (m.senderId === currentUser.id && m.recipientId === CUSTOMER_SERVICE_ID) ||
//               (m.senderId === CUSTOMER_SERVICE_ID && m.recipientId === currentUser.id)
//           );
      
//           const realReplies = relatedMessages.filter(
//             (m: any) =>
//               !m.text.toLowerCase().includes('please specify the topic') &&
//               !m.text.toLowerCase().includes('could you please describe your issue')
//           );
      
//           if (realReplies.length === 0) {
//             showDefaultGreeting = true;
//           }
//         }
      
//         uniqueUsersMap.set(otherUser.id, {
//           id: otherUser.id,
//           name: otherUser.name ?? 'Unknown',
//           image: otherUser.image,
//           hasUnread: isUnread,
//           latestMessage: showDefaultGreeting ? '🚀 Ping us anytime!' : msg.text,
//           latestMessageCreatedAt: msg.createdAt,
//         });
//       } else {
//         if (isUnread) existing.hasUnread = true;
//         if (msg.createdAt > (existing.latestMessageCreatedAt || new Date(0))) {
//           existing.latestMessage = msg.text;
//           existing.latestMessageCreatedAt = msg.createdAt;
//         }
//       }
//     });

//     const result = Array.from(uniqueUsersMap.values());

//     return NextResponse.json(result);
//   } catch (error) {
//     console.error('❌ Error in /api/conversations:', error);
//     // return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
//     return NextResponse.json([], { status: 500 });
//   }
// }

// import { NextResponse } from 'next/server';
// export const dynamic = 'force-dynamic';

// import getCurrentUser from '@/app/actions/getCurrentUser';
// import prisma from '@/app/libs/prismadb';

// export async function GET() {
//   const currentUser = await getCurrentUser();
//   if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

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

//     // Enrich with sender and recipient only for existing users
//     const messages = await Promise.all(
//       rawMessages.map(async (msg) => {
//         const [sender, recipient] = await Promise.all([
//           prisma.user.findUnique({ where: { id: msg.senderId }, select: { id: true, name: true, image: true } }),
//           prisma.user.findUnique({ where: { id: msg.recipientId }, select: { id: true, name: true, image: true } }),
//         ]);

//         if (!sender || !recipient) return null;

//         return {
//           ...msg,
//           sender,
//           recipient,
//         };
//       })
//     );

//     const filteredMessages = messages.filter(Boolean);
//     const uniqueUsersMap = new Map();

//     filteredMessages.forEach((msg: any) => {
//       const isIncoming = msg.recipientId === currentUser.id;
//       const otherUser = isIncoming ? msg.sender : msg.recipient;

//       if (!otherUser || otherUser.id === currentUser.id || !otherUser.name) return;

//       const existing = uniqueUsersMap.get(otherUser.id);
//       const CUSTOMER_SERVICE_ID = '67ef2895f045b7ff3d0cf6fc';
//       const isUnread = isIncoming && !msg.seen;

//       if (!existing) {
//         const isCustomerService = otherUser.id === CUSTOMER_SERVICE_ID;
//         let showDefaultGreeting = false;

//         if (isCustomerService) {
//           const relatedMessages = filteredMessages.filter(
//             (m: any) =>
//               (m.senderId === currentUser.id && m.recipientId === CUSTOMER_SERVICE_ID) ||
//               (m.senderId === CUSTOMER_SERVICE_ID && m.recipientId === currentUser.id)
//           );

//           const realReplies = relatedMessages.filter(
//             (m: any) =>
//               !m.text.toLowerCase().includes('please specify the topic') &&
//               !m.text.toLowerCase().includes('could you please describe your issue')
//           );

//           if (realReplies.length === 0) {
//             showDefaultGreeting = true;
//           }
//         }

//         uniqueUsersMap.set(otherUser.id, {
//           id: otherUser.id,
//           name: otherUser.name ?? 'Unknown',
//           image: otherUser.image,
//           hasUnread: isUnread,
//           latestMessage: showDefaultGreeting ? '🚀 Ping us anytime!' : msg.text,
//           latestMessageCreatedAt: msg.createdAt,
//         });
//       } else {
//         if (isUnread) existing.hasUnread = true;
//         if (msg.createdAt > (existing.latestMessageCreatedAt || new Date(0))) {
//           existing.latestMessage = msg.text;
//           existing.latestMessageCreatedAt = msg.createdAt;
//         }
//       }
//     });

//     const result = Array.from(uniqueUsersMap.values());
//     return NextResponse.json(result);
//   } catch (error) {
//     console.error('❌ Error in /api/conversations:', error);
//     return NextResponse.json([], { status: 500 });
//   }
// }

// import { NextResponse } from 'next/server';
// export const dynamic = 'force-dynamic';

// import getCurrentUser from '@/app/actions/getCurrentUser';
// import prisma from '@/app/libs/prismadb';

// export async function GET() {
//   const currentUser = await getCurrentUser();
//   if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

//   try {
//     const messages = await prisma.message.findMany({
//       where: {
//         OR: [
//           { senderId: currentUser.id },
//           { recipientId: currentUser.id },
//         ],
//         sender: {
//           isNot: {},
//         },
//         recipient: {
//           isNot: {},
//         },
//       },
//       include: {
//         sender: {
//           select: { id: true, name: true, image: true },
//         },
//         recipient: {
//           select: { id: true, name: true, image: true },
//         },
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     const uniqueUsersMap = new Map();

//     messages.forEach((msg) => {
//       if (!msg.sender || !msg.recipient) return;

//       const isIncoming = msg.recipientId === currentUser.id;
//       const otherUser = isIncoming ? msg.sender : msg.recipient;
//       if (otherUser.id === currentUser.id) return;

//       const existing = uniqueUsersMap.get(otherUser.id);
//       const CUSTOMER_SERVICE_ID = '67ef2895f045b7ff3d0cf6fc';
//       const isUnread = isIncoming && !msg.seen;

//       if (!existing) {
//         let latestMessage = msg.text;
//         let showDefaultGreeting = false;

//         if (otherUser.id === CUSTOMER_SERVICE_ID) {
//           const related = messages.filter(
//             (m) =>
//               (m.senderId === currentUser.id && m.recipientId === CUSTOMER_SERVICE_ID) ||
//               (m.senderId === CUSTOMER_SERVICE_ID && m.recipientId === currentUser.id)
//           );

//           const replies = related.filter(
//             (m) =>
//               !m.text.toLowerCase().includes('please specify the topic') &&
//               !m.text.toLowerCase().includes('could you please describe your issue')
//           );

//           if (replies.length === 0) {
//             showDefaultGreeting = true;
//             latestMessage = '🚀 Ping us anytime!';
//           }
//         }

//         uniqueUsersMap.set(otherUser.id, {
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
//           existing.latestMessage = msg.text;
//           existing.latestMessageCreatedAt = msg.createdAt;
//         }
//       }
//     });

//     const result = Array.from(uniqueUsersMap.values());
//     return NextResponse.json(result);
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

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

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

    // ✅ Filter out nulls using a type guard
    const filteredMessages = messages.filter(
      (m): m is NonNullable<typeof m> => m !== null
    );

    const uniqueConversations = new Map();

    for (const msg of filteredMessages) {
      const isIncoming = msg.recipientId === currentUser.id;
      const otherUser = isIncoming ? msg.sender : msg.recipient;

      if (!otherUser || otherUser.id === currentUser.id) continue;

      const existing = uniqueConversations.get(otherUser.id);
      const CUSTOMER_SERVICE_ID = '67ef2895f045b7ff3d0cf6fc';
      const isUnread = isIncoming && !msg.seen;

      if (!existing) {
        let latestMessage = msg.text;
        let showDefaultGreeting = false;

        if (otherUser.id === CUSTOMER_SERVICE_ID) {
          const relatedMsgs = filteredMessages.filter(
            (m) =>
              (m.senderId === currentUser.id && m.recipientId === CUSTOMER_SERVICE_ID) ||
              (m.senderId === CUSTOMER_SERVICE_ID && m.recipientId === currentUser.id)
          );

          const realReplies = relatedMsgs.filter(
            (m) =>
              !m.text.toLowerCase().includes('please specify the topic') &&
              !m.text.toLowerCase().includes('could you please describe your issue')
          );

          if (realReplies.length === 0) {
            showDefaultGreeting = true;
            latestMessage = '🚀 Ping us anytime!';
          }
        }

        uniqueConversations.set(otherUser.id, {
          id: otherUser.id,
          name: otherUser.name ?? 'Unknown',
          image: otherUser.image,
          hasUnread: isUnread,
          latestMessage,
          latestMessageCreatedAt: msg.createdAt,
        });
      } else {
        if (isUnread) existing.hasUnread = true;
        if (msg.createdAt > (existing.latestMessageCreatedAt || new Date(0))) {
          existing.latestMessage = msg.text;
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