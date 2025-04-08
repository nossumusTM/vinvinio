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
    console.log('❌ No current user found in /api/conversations');
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
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📨 Total messages involving currentUser (${currentUser.id}): ${messages.length}`);

    const uniqueUsersMap = new Map<string, any>();

    messages.forEach((msg: any) => {
      const isUserSender = msg.senderId === currentUser.id;
      const partner = isUserSender ? msg.recipient : msg.sender;
    
      if (!partner || !partner.id) {
        console.warn('⚠️ No valid partner user for message:', msg.id);
        return;
      }

      console.log('👥 Conversation partner resolved:', {
        currentUserId: currentUser.id,
        partner: partner?.id,
        isUserSender,
        msgText: msg.text,
      });      
    
      const isUnread = !isUserSender && !msg.seen;
    
      const existing = uniqueUsersMap.get(partner.id);
    
      if (!existing) {
        uniqueUsersMap.set(partner.id, {
          id: partner.id,
          name: partner.name ?? 'Unknown',
          image: partner.image ?? null,
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

    const result = Array.from(uniqueUsersMap.values());
    console.log(`✅ Final conversations for user ${currentUser.id}:`, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error in /api/conversations:', error);
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
