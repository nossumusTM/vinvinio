// /api/reservations/[reservationId]/cancel/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';

import { computeAggregateMaps } from '@/app/(marketplace)/libs/aggregateTotals';
import { MIN_PARTNER_COMMISSION, computeHostShareFromCommission } from '@/app/(marketplace)/constants/partner';

export async function PATCH(
  req: Request,
  { params }: { params: { reservationId: string } } // ✅ Use reservationId
) {
  try {
    const reservationId = params.reservationId;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { listing: { select: { userId: true } } },
    });

    if (!reservation) {
      return new NextResponse('Reservation not found', { status: 404 });
    }

    // Avoid double-decrementing if someone retries the cancel request
    if (reservation.status === 'cancelled') {
      return NextResponse.json({ success: true });
    }

    const hostId = reservation.listing?.userId;

    const aggregateDate = new Date(
      Date.UTC(
        reservation.startDate.getUTCFullYear(),
        reservation.startDate.getUTCMonth(),
        reservation.startDate.getUTCDate(),
      ),
    );

    const promoterCut = reservation.referralId ? (reservation.totalPrice || 0) * 0.1 : 0;

    const { hostBookingCount } = await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'cancelled' },
      });

      // Clean up earnings and platform economy entries linked to this reservation
      await tx.earning.deleteMany({ where: { reservationId } });
      await tx.platformEconomy.deleteMany({ where: { reservationId } });

      if (!hostId) {
        return { hostBookingCount: undefined as number | undefined };
      }

      const host = await tx.user.findUnique({
        where: { id: hostId },
        select: { allTimeBookingCount: true, partnerCommission: true },
      });

      const partnerCommission = Number.isFinite(host?.partnerCommission)
        ? (host?.partnerCommission as number)
        : MIN_PARTNER_COMMISSION;
      const computedHostShare = computeHostShareFromCommission(partnerCommission);
      const hostRevenueDelta = (reservation.totalPrice || 0) * computedHostShare;

      const hostAnalytics = await tx.hostAnalytics.findUnique({
        where: { userId: hostId },
      });

      const { dailyTotals, monthlyTotals, yearlyTotals } = computeAggregateMaps(
        hostAnalytics?.dailyTotals,
        hostAnalytics?.monthlyTotals,
        hostAnalytics?.yearlyTotals,
        aggregateDate,
        -1,
        -hostRevenueDelta,
        -partnerCommission,
      );

      const nextCount = Math.max(0, (host?.allTimeBookingCount ?? 0) - 1);
      const nextTotalBooks = Math.max(0, (hostAnalytics?.totalBooks ?? 0) - 1);
      const nextTotalRevenue = Math.max(0, (hostAnalytics?.totalRevenue ?? 0) - hostRevenueDelta);

      const updatedHost = await tx.user.update({
        where: { id: hostId },
        data: { allTimeBookingCount: nextCount },
        select: { allTimeBookingCount: true },
      });

      await tx.hostAnalytics.upsert({
        where: { userId: hostId },
        update: {
          totalBooks: nextTotalBooks,
          totalRevenue: nextTotalRevenue,
          dailyTotals,
          monthlyTotals,
          yearlyTotals,
        },
        create: {
          userId: hostId,
          totalBooks: 0,
          totalRevenue: 0,
          dailyTotals,
          monthlyTotals,
          yearlyTotals,
        },
      });

      if (reservation.referralId) {
        const promoter = await tx.user.findFirst({
          where: { referenceId: reservation.referralId },
        });

        if (promoter?.id) {
          const promoterAnalytics = await tx.referralAnalytics.findUnique({
            where: { userId: promoter.id },
          });

          const promoterTotals = computeAggregateMaps(
            promoterAnalytics?.dailyTotals,
            promoterAnalytics?.monthlyTotals,
            promoterAnalytics?.yearlyTotals,
            aggregateDate,
            -1,
            -promoterCut,
            0,
          );

          const nextPromoterBooks = Math.max(0, (promoterAnalytics?.totalBooks ?? 0) - 1);
          const nextPromoterRevenue = Math.max(
            0,
            (promoterAnalytics?.totalRevenue ?? 0) - promoterCut,
          );

          await tx.referralAnalytics.upsert({
            where: { userId: promoter.id },
            update: {
              totalBooks: nextPromoterBooks,
              totalRevenue: nextPromoterRevenue,
              dailyTotals: promoterTotals.dailyTotals,
              monthlyTotals: promoterTotals.monthlyTotals,
              yearlyTotals: promoterTotals.yearlyTotals,
            },
            create: {
              userId: promoter.id,
              totalBooks: 0,
              totalRevenue: 0,
              qrScans: 0,
              dailyTotals: promoterTotals.dailyTotals,
              monthlyTotals: promoterTotals.monthlyTotals,
              yearlyTotals: promoterTotals.yearlyTotals,
            },
          });
        }
      }

      return { hostBookingCount: updatedHost.allTimeBookingCount };
    });

    return NextResponse.json({ success: true, bookingCount: hostBookingCount });
  } catch (error) {
    console.error('[RESERVATION_CANCEL]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}