// import { NextResponse } from 'next/server';
//  import getCurrentUser from  '@/app/actions/getCurrentUser';
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

// import { NextResponse } from 'next/server';
//  import getCurrentUser from  '@/app/actions/getCurrentUser';
// import prisma from '@/app/libs/prismadb';

// // export const dynamic = 'force-dynamic';

// export async function GET() {
//   const currentUser = await getCurrentUser();
//   if (!currentUser) return NextResponse.json([], { status: 200 }); // ✅ return empty array for unauthorized

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

//     return NextResponse.json(Array.from(uniqueUsersMap.values()));
//   } catch (error) {
//     console.error('❌ Error in /api/conversations:', error);
//     // ✅ Always return a valid JSON array even on failure
//     return new Response(JSON.stringify([]), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
// }


import { NextResponse } from 'next/server';
import getCurrentUser from  '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

// export async function GET() {
//   const currentUser = await getCurrentUser();
//   if (!currentUser) return NextResponse.json([], { status: 200 });

//   try {
//     // const messages = await prisma.message.findMany({
//     //   where: {
//     //     OR: [
//     //       { senderId: currentUser.id },
//     //       { recipientId: currentUser.id },
//     //     ],
//     //   },
//     //   include: {
//     //     sender: true,
//     //     recipient: true,
//     //   },
//     //   orderBy: { createdAt: 'desc' },
//     // });

//     const messages = await prisma.message.findMany({
//       where: {
//         OR: [
//           { senderId: currentUser.id },
//           { recipientId: currentUser.id },
//         ],
//       },
//       include: {
//         sender: {
//           select: {
//             id: true,
//             name: true,
//             image: true
//           }
//         },
//         recipient: {
//           select: {
//             id: true,
//             name: true,
//             image: true
//           }
//         }
//       },
//       orderBy: { createdAt: 'desc' },
//     });    

//     const uniqueUsersMap = new Map<string, any>();

//     messages.forEach((msg: any) => {
//       // const isIncoming = msg.recipientId === currentUser.id;
//       // const isOutgoing = msg.senderId === currentUser.id;

//       const isIncoming = msg.recipientId === currentUser.id;
//       const otherUser = isIncoming ? msg.sender : msg.recipient;

//       if (!otherUser || !otherUser.id || otherUser.id === currentUser.id) return;

    
//       // const otherUser = isIncoming ? msg.sender : isOutgoing ? msg.recipient : null;
    
//       // if (!otherUser || otherUser.id === currentUser.id || !otherUser.name) return;

//       // if (!otherUser || otherUser.id === currentUser.id) return;

//       if (
//         !otherUser || 
//         !otherUser.id || 
//         otherUser.id === currentUser.id || 
//         (!msg.text && !msg.createdAt)
//       ) return;
      
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

//     return NextResponse.json(Array.from(uniqueUsersMap.values()));
//   } catch (error) {
//     console.error('❌ Error in /api/conversations:', error);
//     return new Response(JSON.stringify([]), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
// }

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    console.log('No current user found.');
    return NextResponse.json([], { status: 200 });
  }

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

    console.log(`Retrieved ${messages.length} messages for user ${currentUser.id}.`);

    const uniqueUsersMap = new Map<string, any>();

    messages.forEach((msg: any) => {
      const isIncoming = msg.recipientId === currentUser.id;
      const isUnread = isIncoming && !msg.seen;
      const otherUser = isIncoming ? msg.sender : msg.recipient;

      if (!otherUser || !otherUser.id || otherUser.id === currentUser.id) {
        console.warn('⚠️ Message skipped (invalid other user)', {
          msgId: msg.id,
          senderId: msg.senderId,
          recipientId: msg.recipientId,
          currentUserId: currentUser.id,
        });
        return;
      }

      const existing = uniqueUsersMap.get(otherUser.id);

      if (!existing) {
        uniqueUsersMap.set(otherUser.id, {
          id: otherUser.id,
          name: otherUser.name || 'User',
          image: otherUser.image || null,
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


    // const conversations = Array.from(uniqueUsersMap.values());
    // console.log(`Returning ${conversations.length} conversations.`);
    // return NextResponse.json(conversations);

    const result = Array.from(uniqueUsersMap.values());
    console.log('✅ Final conversations result:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/conversations:', error);
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}