import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const drafts = await prisma.listingDraft.findMany({
    where: { userId: currentUser.id },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(drafts);
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const { draftId, title, step, data } = body ?? {};

  const normalizedTitle =
    typeof title === 'string' && title.trim().length > 0 ? title.trim() : null;

  const payload = {
    title: normalizedTitle,
    step: Number.isFinite(Number(step)) ? Number(step) : null,
    data: data ?? {},
  };

  if (draftId) {
    const existing = await prisma.listingDraft.findFirst({
      where: { id: String(draftId), userId: currentUser.id },
    });

    if (!existing) {
      return new NextResponse('Draft not found', { status: 404 });
    }

    const updatedDraft = await prisma.listingDraft.update({
      where: { id: existing.id },
      data: payload,
    });

    return NextResponse.json(updatedDraft);
  }

  const draft = await prisma.listingDraft.create({
    data: {
      ...payload,
      user: { connect: { id: currentUser.id } },
    },
  });

  return NextResponse.json(draft);
}