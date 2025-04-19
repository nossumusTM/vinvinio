// /app/api/analytics/earnings/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import getCurrentUser from '@/app/actions/getCurrentUser';

type EarningEntry = {
    amount: number;
    createdAt: Date;
  };  

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const earnings = await prisma.earning.findMany({
    where: { userId: currentUser.id },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let monthlyTotal = 0;
  let yearlyTotal = 0;

  earnings.forEach((entry: EarningEntry) => {
    const date = new Date(entry.createdAt);
    if (date.getFullYear() === currentYear) {
      yearlyTotal += entry.amount;
      if (date.getMonth() === currentMonth) {
        monthlyTotal += entry.amount;
      }
    }
  });

  return NextResponse.json({
    monthlyTotal,
    yearlyTotal,
    all: earnings,
  });
}