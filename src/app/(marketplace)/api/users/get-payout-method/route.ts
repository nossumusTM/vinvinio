// /app/api/users/get-payout-method/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
 import getCurrentUser from  '@/app/(marketplace)/actions/getCurrentUser';
export const dynamic = 'force-dynamic';
import CryptoJS from 'crypto-js';
import { Prisma } from '@prisma/client';
import { ObjectId } from 'mongodb';

const isValidObjectId = (value: string) => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

const SECRET_KEY = process.env.CARD_SECRET_KEY!;

const getUserFromIdentifier = async (identifier: string) => {
  const conditions = [];

  if (isValidObjectId(identifier)) {
    conditions.push({ id: identifier }); // ✅ Only push if valid ObjectId
  }

  conditions.push(
    { email: { equals: identifier, mode: Prisma.QueryMode.insensitive } },
    { referenceId: identifier }
  );

  return await prisma.user.findFirst({
    where: {
      OR: conditions
    }
  });
};

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

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    console.log('🔍 identifier received:', identifier);

    if (!identifier) return new NextResponse('Missing identifier', { status: 400 });

    const user = await getUserFromIdentifier(identifier);
    if (!user) {
      console.log('❌ User not found');
      return new NextResponse('User not found', { status: 404 });
    }

    console.log('✅ Found user:', user.id);

    const payout = await prisma.payout.findUnique({
      where: { userId: user.id },
    });

    if (!payout) {
      console.log('❌ No payout method found for user:', user.id);
      return NextResponse.json(null);
    }

    const decrypt = (text: string) =>
      CryptoJS.AES.decrypt(text, SECRET_KEY).toString(CryptoJS.enc.Utf8);

    const decryptedNumber = decrypt(payout.value);
    console.log('🔐 Decrypted Payout Number:', decryptedNumber);

    return NextResponse.json({
      method: payout.method,
      number: decryptedNumber,
    });
  } catch (error) {
    console.error('[PAYOUT_METHOD_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}