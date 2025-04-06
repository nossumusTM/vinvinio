// /app/api/users/get-payout-method/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import getCurrentUser from '@/app/actions/getCurrentUser';
export const dynamic = 'force-dynamic';
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_CARD_SECRET_KEY!;

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) return new NextResponse('Unauthorized', { status: 401 });

  const payout = await prisma.payout.findUnique({
    where: { userId: currentUser.id },
  });

  if (!payout) return NextResponse.json(null);

  const decrypt = (text: string) => CryptoJS.AES.decrypt(text, SECRET_KEY).toString(CryptoJS.enc.Utf8);

  return NextResponse.json({
    method: payout.method,
    number: decrypt(payout.value),
  });
}