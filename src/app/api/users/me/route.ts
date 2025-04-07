// /app/api/users/me/route.ts
import { NextResponse } from 'next/server';
 import getCurrentUser from  '@/app/actions/getCurrentUser';

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(user);
}