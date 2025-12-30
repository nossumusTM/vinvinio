// utils/updateReferralAnalytics.ts
import prisma from '@/app/(marketplace)/libs/prismadb';

type ReferralEvent = {
  userId: string;        // promoter id
  amount: number;        // booking revenue from which commission is computed
  qrScanIncrement?: 1;   // optional, for QR scans
  createdAt: Date;       // when the booking / scan happened
};

export async function applyReferralEvent(event: ReferralEvent) {
  const { userId, amount, qrScanIncrement = 0, createdAt } = event;

  // Build keys like '2026-11-28', '2026-11', '2026'
  const year = createdAt.getUTCFullYear();
  const month = String(createdAt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(createdAt.getUTCDate()).padStart(2, '0');

  const dayKey = `${year}-${month}-${day}`;
  const monthKey = `${year}-${month}`;
  const yearKey = `${year}`;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.referralAnalytics.findUnique({
      where: { userId },
      select: {
        id: true,
        totalBooks: true,
        totalRevenue: true,
        qrScans: true,
        dailyTotals: true,
        monthlyTotals: true,
        yearlyTotals: true,
      },
    });

    const dailyTotals = (existing?.dailyTotals as any) ?? {};
    const monthlyTotals = (existing?.monthlyTotals as any) ?? {};
    const yearlyTotals = (existing?.yearlyTotals as any) ?? {};

    const bump = (bucket: any, key: string, amount: number, qr: number) => {
      const prev = bucket[key] ?? { bookings: 0, revenue: 0, qrScans: 0 };
      bucket[key] = {
        bookings: (prev.bookings ?? 0) + 1,
        revenue: (prev.revenue ?? 0) + amount,
        qrScans: (prev.qrScans ?? 0) + qr,
      };
    };

    bump(dailyTotals, dayKey, amount, qrScanIncrement);
    bump(monthlyTotals, monthKey, amount, qrScanIncrement);
    bump(yearlyTotals, yearKey, amount, qrScanIncrement);

    if (existing) {
      await tx.referralAnalytics.update({
        where: { id: existing.id },
        data: {
          totalBooks: (existing.totalBooks ?? 0) + 1,
          totalRevenue: (existing.totalRevenue ?? 0) + amount,
          qrScans: (existing.qrScans ?? 0) + qrScanIncrement,
          dailyTotals,
          monthlyTotals,
          yearlyTotals,
        },
      });
    } else {
      await tx.referralAnalytics.create({
        data: {
          userId,
          totalBooks: 1,
          totalRevenue: amount,
          qrScans: qrScanIncrement,
          dailyTotals,
          monthlyTotals,
          yearlyTotals,
        },
      });
    }
  });
}