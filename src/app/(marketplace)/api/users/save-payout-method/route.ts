// /app/api/users/save-payout-method/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
 import getCurrentUser from  '@/app/(marketplace)/actions/getCurrentUser';
export const dynamic = 'force-dynamic';
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.CARD_SECRET_KEY!;

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) return new NextResponse('Unauthorized', { status: 401 });

  const { method, number } = await req.json();

  if (!method || !number) {
    return new NextResponse('Missing fields', { status: 400 });
  }

  const encrypt = (text: string) => CryptoJS.AES.encrypt(text, SECRET_KEY).toString();

  await prisma.$transaction(async (trx) => {
    await trx.payout.deleteMany({ where: { userId: currentUser.id, kind: 'method' } });

    await trx.payout.create({
      data: {
        method,
        value: encrypt(number),
        userId: currentUser.id,
        kind: 'method',
        username: currentUser.username ?? undefined,
        email: currentUser.email ?? undefined,
      },
    });
  });

  return NextResponse.json({ message: 'Payout method saved' });
}
