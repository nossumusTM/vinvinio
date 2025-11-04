// /app/api/users/me/route.ts
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
 import getCurrentUser from  '@/app/(marketplace)/actions/getCurrentUser';

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(user);
}