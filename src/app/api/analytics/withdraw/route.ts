import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import getCurrentUser from '@/app/actions/getCurrentUser';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'host') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return new NextResponse('Missing userId', { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'promoter') {
      return new NextResponse('User not found or not a promoter', { status: 404 });
    }

    await prisma.referralAnalytics.update({
      where: { userId },
      data: {
        totalBooks: 0,
        qrScans: 0,
        totalRevenue: 0,
      }
    });

    return NextResponse.json({ message: `Withdraw completed for ${user.name || user.email}` });
  } catch (error) {
    console.error('Withdraw error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}