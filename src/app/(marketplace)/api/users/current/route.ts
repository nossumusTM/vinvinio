// /app/api/users/current/route.ts
import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';

export async function GET() {
  try {
    const user = await getCurrentUser();

    // Always return a 200 response with either user or null
    return NextResponse.json(user ?? null, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Error in /api/users/current:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}