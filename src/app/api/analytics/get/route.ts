// /app/api/analytics/get/route.ts
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/app/libs/prismadb';
import getCurrentUser from '@/app/actions/getCurrentUser';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) return new NextResponse('Unauthorized', { status: 401 });

  const analytics = await prisma.referralAnalytics.findUnique({
    where: { userId: currentUser.id }
  });

  return NextResponse.json(analytics || { totalBooks: 0, qrScans: 0, totalRevenue: 0 });
}