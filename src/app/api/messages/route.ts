// import { NextResponse } from 'next/server';
// export const dynamic = 'force-dynamic';
// import prisma from '@/app/libs/prismadb';
//  import getCurrentUser from  '@/app/actions/getCurrentUser';
// import { ObjectId } from 'mongodb';

// export async function GET(request: Request) {
//     const currentUser = await getCurrentUser();
//     if (!currentUser) {
//       return new NextResponse('Unauthorized', { status: 401 });
//     }
  
//     const { searchParams } = new URL(request.url);
//     const recipientId = searchParams.get('recipientId');
  
//     if (!recipientId) {
//       return new NextResponse('Recipient ID is required', { status: 400 });
//     }
  
//     try {
//       const messages = await prisma.message.findMany({
//         where: {
//           OR: [
//             {
//               senderId: currentUser.id,
//               recipientId,
//             },
//             {
//               senderId: recipientId,
//               recipientId: currentUser.id,
//             },
//           ],
//         },
//         orderBy: { createdAt: 'asc' },
//       });
  
//       return NextResponse.json(messages);
//     } catch (error: unknown) {
//       const message = error instanceof Error ? error.message : 'Unknown error';
//       console.error('Error fetching messages:', message);
//       return new NextResponse(JSON.stringify({ error: message }), { status: 500 });
//     }
//   }

// export async function POST(request: Request) {
//     const currentUser = await getCurrentUser();
//     if (!currentUser) {
//       return new NextResponse('Unauthorized', { status: 401 });
//     }
  
//     try {
//       const { recipientId, text } = await request.json();
  
//       if (!recipientId || !text) {
//         return new NextResponse('Recipient ID and text are required', { status: 400 });
//       }
  
//       const newMessage = await prisma.message.create({
//         data: {
//           senderId: currentUser.id,      // string OK
//           recipientId,                   // string OK
//           text,
//           seen: false, // 👈 important
//         },
//       });
  
//       return NextResponse.json(newMessage);
//     } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//         console.error('Error sending message:', errorMessage);
//         return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
//     }
// }  
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import prisma from '@/app/libs/prismadb';
 import getCurrentUser from  '@/app/actions/getCurrentUser';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const recipientId = searchParams.get('recipientId');

  if (!recipientId) {
    return new NextResponse('Recipient ID is required', { status: 400 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: currentUser.id,
            recipientId,
          },
          {
            senderId: recipientId,
            recipientId: currentUser.id,
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching messages:', message);
    return new NextResponse(JSON.stringify({ error: message }), { status: 500 });
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { recipientId, text } = await request.json();

    if (!recipientId || !text) {
      return new NextResponse('Recipient ID and text are required', { status: 400 });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: currentUser.id,
        recipientId,
        text,
        seen: false,
      },
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending message:', errorMessage);
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}