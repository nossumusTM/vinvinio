// /app/api/users/delete-card/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
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

    return NextResponse.json({ message: 'Card deleted' });
  } catch (err) {
    console.error(err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}