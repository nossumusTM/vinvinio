// /app/api/users/get-card/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
 import getCurrentUser from  '@/app/actions/getCurrentUser';
export const dynamic = 'force-dynamic';
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_CARD_SECRET_KEY!;

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) return new NextResponse('Unauthorized', { status: 401 });

    const card = await prisma.card.findFirst({
      where: { userId: currentUser.id },
    });

    if (!card) return NextResponse.json(null);

    const decrypt = (text: string) =>
      CryptoJS.AES.decrypt(text, SECRET_KEY).toString(CryptoJS.enc.Utf8);

    const decryptedCard = {
      id: card.id,
      number: decrypt(card.number),
      expiration: decrypt(card.expiration),
      cvv: decrypt(card.cvv),
      name: decrypt(card.name),
      address: decrypt(card.address),
      city: card.city,
      zip: card.zip,
      country: card.country,
    };

    return NextResponse.json(decryptedCard);
  } catch (err) {
    console.error('[GET_CARD]', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
