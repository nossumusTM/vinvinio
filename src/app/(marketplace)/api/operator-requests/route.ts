import { NextResponse } from 'next/server';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import { SUPPORT_OPERATOR_ID } from '@/app/(marketplace)/constants/operator';
import prisma from '@/app/(marketplace)/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  try {
    if (currentUser.isOperator) {
      const [openCount, assignedCount, closedCount, requests] = await Promise.all([
        prisma.operatorRequest.count({ where: { status: 'open' } }),
        prisma.operatorRequest.count({ where: { status: 'assigned' } }),
        prisma.operatorRequest.count({ where: { status: 'closed' } }),
        prisma.operatorRequest.findMany({
          where: {
            OR: [
              { status: 'open' },
              { status: 'assigned', operatorId: currentUser.id },
            ],
          },
          include: {
            requester: { select: { id: true, name: true, image: true, username: true } },
            operator: { select: { id: true, name: true, image: true, username: true } },
          },
          orderBy: [{ status: 'asc' }, { latestMessageAt: 'desc' }, { createdAt: 'desc' }],
          take: 50,
        }),
      ]);

      return NextResponse.json({
        counts: { open: openCount, assigned: assignedCount, closed: closedCount },
        requests: requests.map((request) => ({
          id: request.id,
          status: request.status,
          latestMessage: request.latestMessage ?? 'No message yet',
          latestMessageAt: request.latestMessageAt ?? request.updatedAt,
          assignedAt: request.assignedAt,
          requester: request.requester,
          operator: request.operator,
        })),
      });
    }

    const request = await prisma.operatorRequest.findFirst({
      where: {
        requesterId: currentUser.id,
        status: { in: ['open', 'assigned'] },
      },
      include: {
        operator: { select: { id: true, name: true, image: true, username: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ request: request ?? null });
  } catch (error) {
    console.error('[OPERATOR_REQUESTS_GET]', error);
    return new NextResponse('Failed to fetch operator requests.', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse('Unauthorized', { status: 401 });

  if (!currentUser.isOperator) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
  const action = typeof body?.action === 'string' ? body.action.trim() : '';

  if (!requestId) {
    return new NextResponse('requestId is required.', { status: 400 });
  }

  try {
    if (action === 'accept') {
      const accepted = await prisma.operatorRequest.updateMany({
        where: {
          id: requestId,
          status: 'open',
          operatorId: null,
        },
        data: {
          status: 'assigned',
          operatorId: currentUser.id,
          assignedAt: new Date(),
        },
      });

      if (accepted.count === 0) {
        const existing = await prisma.operatorRequest.findUnique({
          where: { id: requestId },
          select: { id: true, status: true, operatorId: true },
        });

        if (!existing) return new NextResponse('Request not found.', { status: 404 });
        if (existing.operatorId && existing.operatorId !== currentUser.id) {
          return new NextResponse('Request already assigned to another operator.', { status: 409 });
        }
      }

      const updated = await prisma.operatorRequest.findUnique({
        where: { id: requestId },
        include: {
          requester: { select: { id: true, name: true, image: true, username: true } },
          operator: { select: { id: true, name: true, image: true, username: true } },
        },
      });

      await prisma.message.updateMany({
        where: {
          operatorRequestId: requestId,
          recipientId: SUPPORT_OPERATOR_ID,
        },
        data: {
          recipientId: currentUser.id,
        },
      });

      return NextResponse.json({ request: updated });
    }

    if (action === 'close') {
      const existing = await prisma.operatorRequest.findUnique({
        where: { id: requestId },
        select: { id: true, operatorId: true, status: true },
      });

      if (!existing) return new NextResponse('Request not found.', { status: 404 });
      if (existing.operatorId !== currentUser.id) {
        return new NextResponse('Only assigned operator can close this request.', { status: 403 });
      }

      const updated = await prisma.operatorRequest.update({
        where: { id: requestId },
        data: {
          status: 'closed',
          closedAt: new Date(),
        },
      });

      return NextResponse.json({ request: updated });
    }

    return new NextResponse('Unsupported action.', { status: 400 });
  } catch (error) {
    console.error('[OPERATOR_REQUESTS_PATCH]', error);
    return new NextResponse('Failed to update request.', { status: 500 });
  }
}
