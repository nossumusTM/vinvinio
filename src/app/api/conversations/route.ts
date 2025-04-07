// import { NextResponse } from 'next/server';
// import getCurrentUser from '@/app/actions/getCurrentUser';
// import prisma from '@/app/libs/prismadb';

// export const dynamic = 'force-dynamic';

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
//       const isUnread = isIncoming && !msg.seen;

//       if (!existing) {
//         uniqueUsersMap.set(otherUser.id, {
//           id: otherUser.id,
//           name: otherUser.name ?? 'Unknown',
//           image: otherUser.image,
//           hasUnread: isUnread,
//           latestMessage: msg.text,
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

import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json([], { status: 200 }); // ✅ return empty array for unauthorized

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
      const isUnread = isIncoming && !msg.seen;

      if (!existing) {
        uniqueUsersMap.set(otherUser.id, {
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

    return NextResponse.json(Array.from(uniqueUsersMap.values()));
  } catch (error) {
    console.error('❌ Error in /api/conversations:', error);
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
