import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { Prisma } from '@prisma/client';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

const isValidObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

const getUserFromIdentifier = async (identifier: string) => {
  const conditions = [];

  if (isValidObjectId(identifier)) {
    conditions.push({ id: identifier }); // ✅ Only push if valid ObjectId
  }

  conditions.push(
    { email: { equals: identifier, mode: Prisma.QueryMode.insensitive } },
    { referenceId: identifier }
  );

  return await prisma.user.findFirst({
    where: {
      OR: conditions
    }
  });
};

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'host') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  try {
    const analytics = await prisma.hostAnalytics.findUnique({
      where: { userId: currentUser.id },
    });

    return NextResponse.json({
      totalBooks: analytics?.totalBooks || 0,
      totalRevenue: analytics?.totalRevenue || 0,
    });
  } catch (error) {
    console.error('[HOST_ANALYTICS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    if (!identifier) return new NextResponse('Missing identifier', { status: 400 });

    const user = await getUserFromIdentifier(identifier);
    if (!user) return new NextResponse('User not found', { status: 404 });

    const analytics = await prisma.hostAnalytics.findUnique({
      where: { userId: user.id }
    });

    return NextResponse.json({
      userId: user.id,
      totalBooks: analytics?.totalBooks || 0,
      totalRevenue: analytics?.totalRevenue || 0,
    });
  } catch (error) {
    console.error('[HOST_ANALYTICS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}