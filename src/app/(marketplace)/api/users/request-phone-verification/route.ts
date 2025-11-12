import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/app/(marketplace)/libs/prismadb';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, phone: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.phone) {
      return NextResponse.json({ error: 'Phone number missing' }, { status: 400 });
    }

    console.info('[phone-verification] Request initiated for user', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error starting phone verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}