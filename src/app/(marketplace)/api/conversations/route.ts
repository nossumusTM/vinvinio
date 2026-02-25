import { NextResponse } from 'next/server';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import { SUPPORT_OPERATOR_ID } from '@/app/(marketplace)/constants/operator';
import prisma from '@/app/(marketplace)/libs/prismadb';

export const dynamic = 'force-dynamic';

type MessageType = 'text' | 'attachment' | 'audio';

const detectMessageType = (msg: any): MessageType => {
  if (msg?.audioUrl) return 'audio';
  if (msg?.attachmentUrl) return 'attachment';
  return 'text';
};

const formatMessagePreview = (msg: any): string => {
  const type = detectMessageType(msg);
  if (type === 'audio') return 'Voice note';
  if (type === 'attachment') return msg?.attachmentName ? `Attachment: ${msg.attachmentName}` : 'Attachment';
  if (msg?.text && typeof msg.text === 'string') return msg.text;
  return 'New message';
};

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const rawMessages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: currentUser.id }, { recipientId: currentUser.id }],
      },
      orderBy: { createdAt: 'desc' },
      take: 250,
    });

    const messages = await Promise.all(
      rawMessages.map(async (msg) => {
        const [sender, recipient] = await Promise.all([
          prisma.user.findUnique({
            where: { id: msg.senderId },
            select: { id: true, name: true, image: true, isOperator: true },
          }),
          prisma.user.findUnique({
            where: { id: msg.recipientId },
            select: { id: true, name: true, image: true, isOperator: true },
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

    for (const msg of filteredMessages) {
      const isIncoming = msg.recipientId === currentUser.id;
      const realOtherUser = isIncoming ? msg.sender : msg.recipient;
      if (!realOtherUser || realOtherUser.id === currentUser.id) continue;

      const isSupportMessage = Boolean(msg.operatorRequestId);
      const normalizedConversationId =
        !currentUser.isOperator && isSupportMessage ? SUPPORT_OPERATOR_ID : realOtherUser.id;
      const normalizedName =
        !currentUser.isOperator && isSupportMessage ? 'Operator' : realOtherUser.name ?? 'Unknown';
      const normalizedImage =
        !currentUser.isOperator && isSupportMessage ? '/images/operator.png' : realOtherUser.image;

      const existing = uniqueConversations.get(normalizedConversationId);
      const isUnread = isIncoming && !msg.seen;

      if (!existing) {
        uniqueConversations.set(normalizedConversationId, {
          id: normalizedConversationId,
          name: normalizedName,
          image: normalizedImage ?? undefined,
          hasUnread: isUnread,
          latestMessage: formatMessagePreview(msg),
          latestMessageType: detectMessageType(msg),
          latestMessageCreatedAt: msg.createdAt,
        });
        continue;
      }

      if (isUnread) existing.hasUnread = true;
      if (msg.createdAt > existing.latestMessageCreatedAt) {
        existing.latestMessage = formatMessagePreview(msg);
        existing.latestMessageType = detectMessageType(msg);
        existing.latestMessageCreatedAt = msg.createdAt;
      }
    }

    if (!currentUser.isOperator && !uniqueConversations.has(SUPPORT_OPERATOR_ID)) {
      uniqueConversations.set(SUPPORT_OPERATOR_ID, {
        id: SUPPORT_OPERATOR_ID,
        name: 'Operator',
        image: '/images/operator.png',
        hasUnread: false,
        latestMessage: 'Ping us anytime!',
        latestMessageType: 'text',
        latestMessageCreatedAt: new Date(),
      });
    }

    return NextResponse.json(Array.from(uniqueConversations.values()));
  } catch (error) {
    console.error('[CONVERSATIONS_GET]', error);
    return NextResponse.json([], { status: 500 });
  }
}
