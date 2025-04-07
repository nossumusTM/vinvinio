// /app/api/users/save-payout-method/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
 import getCurrentUser from  '@/app/actions/getCurrentUser';
export const dynamic = 'force-dynamic';
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_CARD_SECRET_KEY!;

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) return new NextResponse('Unauthorized', { status: 401 });

  const { method, number } = await req.json();

  if (!method || !number) {
    return new NextResponse('Missing fields', { status: 400 });
  }

  const encrypt = (text: string) => CryptoJS.AES.encrypt(text, SECRET_KEY).toString();

  await prisma.payout.upsert({
    where: { userId: currentUser.id },
    update: {
      method,
      value: encrypt(number),
    },
    create: {
      method,
      value: encrypt(number),
      userId: currentUser.id,
    },
  });

  return NextResponse.json({ message: 'Payout method saved' });
}
