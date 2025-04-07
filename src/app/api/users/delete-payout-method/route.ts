// /app/api/users/delete-payout-method/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
 import getCurrentUser from  '@/app/actions/getCurrentUser';
export const dynamic = 'force-dynamic';

export async function DELETE() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) return new NextResponse('Unauthorized', { status: 401 });

  await prisma.payout.deleteMany({
    where: { userId: currentUser.id },
  });

  return NextResponse.json({ message: 'Payout method deleted' });
}
