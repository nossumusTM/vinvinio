import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { MAX_PINNED_CATEGORIES } from '@/app/(marketplace)/constants/categoryPreferences';

export const dynamic = 'force-dynamic';

const normalizeCategories = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item : null))
    .filter((item): item is string => Boolean(item))
    .slice(0, MAX_PINNED_CATEGORIES);
};

export async function GET() {
  const record = await prisma.pinnedCategoryConfig.findFirst({
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ data: normalizeCategories(record?.categories) });
}

export async function PUT(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const categories = normalizeCategories(body?.categories);
  const existing = await prisma.pinnedCategoryConfig.findFirst({
    orderBy: { updatedAt: 'desc' },
  });

  const record = existing
    ? await prisma.pinnedCategoryConfig.update({
        where: { id: existing.id },
        data: {
          categories,
          updatedById: currentUser.id,
        },
      })
    : await prisma.pinnedCategoryConfig.create({
        data: {
          categories,
          updatedById: currentUser.id,
        },
      });

  return NextResponse.json({ data: normalizeCategories(record.categories) });
}
