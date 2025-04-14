import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import prisma from '@/app/libs/prismadb';
import getCurrentUser from  '@/app/actions/getCurrentUser';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

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

// export async function POST(request: Request) {
//   const currentUser = await getCurrentUser();
//   if (!currentUser) {
//     return new NextResponse('Unauthorized', { status: 401 });
//   }

//   try {
//     const { recipientId, text } = await request.json();

//     if (!recipientId || !text) {
//       return new NextResponse('Recipient ID and text are required', { status: 400 });
//     }

//     const newMessage = await prisma.message.create({
//       data: {
//         senderId: currentUser.id,
//         recipientId,
//         text,
//         seen: false,
//       },
//     });

//     return NextResponse.json(newMessage);
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//     console.error('Error sending message:', errorMessage);
//     return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
//   }
// }

// export async function POST(request: Request) {
//   const currentUser = await getCurrentUser();
//   if (!currentUser) {
//     return new NextResponse('Unauthorized', { status: 401 });
//   }

//   try {
//     const { recipientId, text, senderId } = await request.json();

//     if (!recipientId || !text) {
//       return new NextResponse('Recipient ID and text are required', { status: 400 });
//     }

//     // Prevent users from spoofing senderId
//     const isSystemMessage = senderId && senderId !== currentUser.id;

//     if (isSystemMessage && currentUser.email !== 'admin@yourapp.com') {
//       // Optional: restrict system messages to only admin or internal calls
//       return new NextResponse('Forbidden: Cannot spoof senderId', { status: 403 });
//     }

//     const newMessage = await prisma.message.create({
//       data: {
//         senderId: isSystemMessage ? senderId : currentUser.id,
//         recipientId,
//         text,
//         seen: false,
//       },
//     });

//     return NextResponse.json(newMessage);
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//     console.error('Error sending message:', errorMessage);
//     return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
//   }
// }

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { recipientId, text, senderId } = await request.json();

    if (!recipientId || !text) {
      return new NextResponse('Recipient ID and text are required', { status: 400 });
    }

    const isSystemMessage = senderId && senderId !== currentUser.id;

    if (isSystemMessage && currentUser.email !== 'admin@yourapp.com') {
      return new NextResponse('Forbidden: Cannot spoof senderId', { status: 403 });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: isSystemMessage ? senderId : currentUser.id,
        recipientId,
        text,
        seen: false,
      },
    });

    // ✅ Fetch recipient details
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    // ✅ If recipient has email, send notification
    if (recipient?.email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const timeSent = format(new Date(), 'PPPpp');
      const senderName = currentUser.name || 'Someone';

      await transporter.sendMail({
        from: `"Vuoiaggio Messenger" <${process.env.EMAIL_USER}>`,
        to: recipient.email,
        subject: `You've received a new message from ${senderName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
            <img src="https://vuoiaggio.netlify.app/images/vuoiaggiologo.png" alt="Vuoiaggio Logo" style="height: 40px; margin-bottom: 24px;" />
            <h2 style="color: #08e2ff;">New message from ${senderName}</h2>

            <p>Hi <strong>${recipient.name || 'there'}</strong>,</p>
            <p>You’ve just received a new message on Vuoiaggio:</p>

            <blockquote style="margin: 16px 0; padding: 16px; background: #f9f9f9; border-left: 4px solid #08e2ff;">
              <p style="margin: 0;">"${text}"</p>
              <small style="color: #666;">Sent on ${timeSent}</small>
            </blockquote>

            <p>To respond, just open Vuoiaggio and click the Messenger icon in the corner to continue chatting.</p>

            <p style="margin-top: 32px;">Thanks for staying connected with <strong>Vuoiaggio</strong> 💙</p>

            <p style="font-size: 13px; color: #888; margin-top: 40px;">Vuoiaggio International Srls.<br/>
            P.IVA 57483813574<br/>
            Via Novacella 18, Rome, RM, Italy<br/>
            🇮🇹 +39 371 528 4911<br/>
            ciao@vuoiaggio.it</p>
          </div>
        `,
      });
    }

    return NextResponse.json(newMessage);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending message:', errorMessage);
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}