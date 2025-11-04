// /app/api/users/delete-saved-card/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
 import getCurrentUser from  '@/app/(marketplace)/actions/getCurrentUser';
export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) return new NextResponse('Unauthorized', { status: 401 });

    await prisma.card.deleteMany({
      where: {
        userId: currentUser.id
      }
    });

    return NextResponse.json({ message: 'Card deleted successfully' });
  } catch (err) {
    console.error('Error deleting card:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}