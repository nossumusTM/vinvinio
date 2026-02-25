import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import { SUPPORT_OPERATOR_ID } from '@/app/(marketplace)/constants/operator';
import prisma from '@/app/(marketplace)/libs/prismadb';

export const dynamic = 'force-dynamic';

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

const getActiveRequestForUser = async (requesterId: string) =>
  prisma.operatorRequest.findFirst({
    where: {
      requesterId,
      status: { in: ['open', 'assigned'] },
    },
    orderBy: { updatedAt: 'desc' },
  });

const resolveOperatorThread = async (currentUserId: string, recipientId: string) => {
  const request = await prisma.operatorRequest.findFirst({
    where: {
      requesterId: recipientId,
      operatorId: currentUserId,
      status: { in: ['open', 'assigned'] },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return request ?? null;
};

const sendMessageEmail = async ({
  recipientEmail,
  recipientName,
  senderName,
  text,
}: {
  recipientEmail: string;
  recipientName?: string | null;
  senderName: string;
  text: string;
}) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const timeSent = format(new Date(), 'PPPpp');

  await transporter.sendMail({
    from: `"Vinvin Messenger" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `You've received a new message from ${senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
        <img src="https://vinvin.io/images/vuoiaggiologo.png" alt="Vinvin Logo" style="height: 40px; margin-bottom: 24px;" />
        <h2 style="color: #3604ff;">New message from ${senderName}</h2>
        <p>Hi <strong>${recipientName || 'there'}</strong>,</p>
        <p>You’ve just received a new message on Vinvin:</p>
        <blockquote style="margin: 16px 0; padding: 16px; background: #f9f9f9; border-left: 4px solid #3604ff;">
          <p style="margin: 0;">"${text}"</p>
          <small style="color: #666;">Sent on ${timeSent}</small>
        </blockquote>
        <p>To respond, open Vinvin and continue the chat in Messenger.</p>
      </div>
    `,
  });
};

export async function GET(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const recipientId = searchParams.get('recipientId');

  if (!recipientId) {
    return new NextResponse('Recipient ID is required', { status: 400 });
  }

  try {
    if (!currentUser.isOperator && recipientId === SUPPORT_OPERATOR_ID) {
      const request = await getActiveRequestForUser(currentUser.id);
      if (!request) return NextResponse.json([]);

      const messages = await prisma.message.findMany({
        where: { operatorRequestId: request.id },
        include: {
          sender: { select: { id: true, name: true, image: true } },
          recipient: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json(messages);
    }

    if (currentUser.isOperator && recipientId !== SUPPORT_OPERATOR_ID) {
      const request = await resolveOperatorThread(currentUser.id, recipientId);
      if (request) {
        const messages = await prisma.message.findMany({
          where: { operatorRequestId: request.id },
          include: {
            sender: { select: { id: true, name: true, image: true } },
            recipient: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json(messages);
      }
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id, recipientId },
          { senderId: recipientId, recipientId: currentUser.id },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        recipient: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('[MESSAGES_GET]', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch messages' }), { status: 500 });
  }
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await req.json().catch(() => null);

    const recipientId = typeof body?.recipientId === 'string' ? body.recipientId.trim() : '';
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const senderId = typeof body?.senderId === 'string' ? body.senderId.trim() : '';
    const operatorRequestIdFromBody =
      typeof body?.operatorRequestId === 'string' ? body.operatorRequestId.trim() : '';

    const attachmentUrl = typeof body?.attachmentUrl === 'string' ? body.attachmentUrl : undefined;
    const attachmentName = typeof body?.attachmentName === 'string' ? body.attachmentName : undefined;
    const attachmentType = typeof body?.attachmentType === 'string' ? body.attachmentType : undefined;
    const attachmentSize = typeof body?.attachmentSize === 'number' ? body.attachmentSize : undefined;
    const audioUrl = typeof body?.audioUrl === 'string' ? body.audioUrl : undefined;
    const audioDurationMs = typeof body?.audioDurationMs === 'number' ? body.audioDurationMs : undefined;

    if (!recipientId) {
      return new NextResponse('Recipient ID is required', { status: 400 });
    }

    const hasText = text.length > 0;
    const hasAttachment = Boolean(attachmentUrl);
    const hasAudio = Boolean(audioUrl);

    if (!hasText && !hasAttachment && !hasAudio) {
      return new NextResponse('A message, attachment, or voice note is required', { status: 400 });
    }

    if (attachmentSize && attachmentSize > MAX_ATTACHMENT_SIZE) {
      return new NextResponse('Attachments must be 5MB or smaller', { status: 400 });
    }

    const isSystemMessage = Boolean(senderId && senderId !== currentUser.id);
    if (isSystemMessage && currentUser.email !== 'admin@yourapp.com') {
      return new NextResponse('Forbidden: Cannot spoof senderId', { status: 403 });
    }

    const resolvedSenderId = isSystemMessage ? senderId : currentUser.id;
    let resolvedRecipientId = recipientId;
    let resolvedOperatorRequestId: string | undefined = undefined;

    if (!currentUser.isOperator && recipientId === SUPPORT_OPERATOR_ID) {
      const activeRequest = await getActiveRequestForUser(currentUser.id);
      const latestMessage = hasText ? text : hasAudio ? 'Voice message' : attachmentName || 'Attachment';

      if (activeRequest) {
        resolvedOperatorRequestId = activeRequest.id;
        if (activeRequest.status === 'assigned' && activeRequest.operatorId) {
          resolvedRecipientId = activeRequest.operatorId;
        }

        await prisma.operatorRequest.update({
          where: { id: activeRequest.id },
          data: {
            latestMessage,
            latestMessageAt: new Date(),
          },
        });
      } else {
        const createdRequest = await prisma.operatorRequest.create({
          data: {
            requesterId: currentUser.id,
            status: 'open',
            latestMessage,
            latestMessageAt: new Date(),
          },
        });
        resolvedOperatorRequestId = createdRequest.id;
      }
    }

    if (currentUser.isOperator && recipientId !== SUPPORT_OPERATOR_ID) {
      let request = null;

      if (operatorRequestIdFromBody) {
        request = await prisma.operatorRequest.findUnique({
          where: { id: operatorRequestIdFromBody },
        });
      } else {
        request = await resolveOperatorThread(currentUser.id, recipientId);
      }

      if (request && request.operatorId === currentUser.id && request.status !== 'closed') {
        resolvedOperatorRequestId = request.id;
      }
    }

    const messageType = hasAudio ? 'audio' : hasAttachment ? 'attachment' : 'text';
    const fallbackText = hasText ? text : hasAudio ? 'Voice message' : attachmentName || 'Attachment';

    const createdMessage = await prisma.message.create({
      data: {
        senderId: resolvedSenderId,
        recipientId: resolvedRecipientId,
        operatorRequestId: resolvedOperatorRequestId,
        text: fallbackText,
        messageType,
        attachmentUrl,
        attachmentName,
        attachmentType,
        attachmentSize,
        audioUrl,
        audioDurationMs,
        seen: false,
      },
    });

    if (resolvedOperatorRequestId && currentUser.isOperator) {
      await prisma.operatorRequest.update({
        where: { id: resolvedOperatorRequestId },
        data: {
          latestMessage: fallbackText,
          latestMessageAt: new Date(),
          status: 'assigned',
        },
      });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: resolvedRecipientId },
      select: { email: true, name: true },
    });

    if (recipient?.email && hasText) {
      const senderName = currentUser.name || 'Someone';
      await sendMessageEmail({
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        senderName,
        text: fallbackText,
      });
    }

    return NextResponse.json(createdMessage);
  } catch (error) {
    console.error('[MESSAGES_POST]', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to send message' }), { status: 500 });
  }
}
