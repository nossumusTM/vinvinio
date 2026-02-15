import { NextResponse } from 'next/server';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import { findUserIdByHandle } from '@/app/(marketplace)/libs/userHandles';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const identifier = (searchParams.get('identifier') ?? '').trim();

  if (!identifier) {
    return new NextResponse('Identifier is required.', { status: 400 });
  }

  try {
    const userId = await findUserIdByHandle(identifier);

    if (!userId) {
      return new NextResponse('User not found.', { status: 404 });
    }

    return NextResponse.json({ userId });
  } catch (error) {
    console.error('[MODER_RESOLVE_USER]', error);
    return new NextResponse('Failed to resolve user.', { status: 500 });
  }
}
