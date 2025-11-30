import { NextResponse } from "next/server";
import prisma from "@/app/(marketplace)/libs/prismadb";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import { hrefForListing } from "@/app/(marketplace)/libs/links";
import { ensureListingSlug } from "@/app/(marketplace)/libs/ensureListingSlug";
import { computeAggregateMaps } from "@/app/(marketplace)/libs/aggregateTotals";
import { MIN_PARTNER_COMMISSION, computeHostShareFromCommission } from "@/app/(marketplace)/constants/partner";
export const dynamic = 'force-dynamic';
import { Prisma } from '@prisma/client';
import { Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    const {
      listingId,
      startDate,
      endDate,
      totalPrice,
      referralId,
      selectedTime,
      guestCount,
      legalName,
      contact,
    } = body;

    const [h, m = '00'] = selectedTime.split(':');
    const normalizedTime = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;

    if (!listingId || !startDate || !endDate || !totalPrice || !selectedTime) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const resolvedGuestCount = guestCount ?? 1;

    const reservationData: Prisma.ReservationCreateInput = currentUser
      ? {
          user: { connect: { id: currentUser.id } },
          listing: { connect: { id: listingId } },
          // startDate,
          // endDate,
          startDate: new Date(`${startDate}T00:00:00.000Z`),
          endDate: new Date(`${endDate}T00:00:00.000Z`),
          totalPrice,
          time: normalizedTime,
          referralId: referralId || null,
          guestCount: resolvedGuestCount,
        }
      : {
          listing: { connect: { id: listingId } },
          // startDate,
          // endDate,
          startDate: new Date(`${startDate}T00:00:00.000Z`),
          endDate: new Date(`${endDate}T00:00:00.000Z`),
          totalPrice,
          time: normalizedTime,
          referralId: referralId || null,
          guestCount: resolvedGuestCount,
          guestName: legalName || 'Guest',
          guestContact: contact || '',
        };

    const reservation = await prisma.reservation.create({
      data: reservationData,
    });
    

    const fullListing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true },
    });

    if (!fullListing || !fullListing.user) {
      return new NextResponse("Listing or host not found", { status: 404 });
    }

    const listingWithSlug = await ensureListingSlug(fullListing);

    await prisma.user.update({
      where: { id: listingWithSlug.user.id },
      data: {
        allTimeBookingCount: { increment: 1 },
      },
    });

    // ✅ Update HostAnalytics (not User anymore)
    if (listingWithSlug?.user?.id) {
      const partnerCommission = Number.isFinite(listingWithSlug.user.partnerCommission)
        ? listingWithSlug.user.partnerCommission
        : MIN_PARTNER_COMMISSION;
      const hostShare = computeHostShareFromCommission(partnerCommission);
      const revenueDelta = (totalPrice || 0) * hostShare;

      const existingHostAnalytics = await prisma.hostAnalytics.findUnique({
        where: { userId: listingWithSlug.user.id },
      });

      const aggregateDateBase =
        reservation.startDate ?? new Date(`${startDate}T00:00:00.000Z`);
      const aggregateDate = new Date(
        Date.UTC(
          aggregateDateBase.getUTCFullYear(),
          aggregateDateBase.getUTCMonth(),
          aggregateDateBase.getUTCDate(),
        ),
      );

      const { dailyTotals, monthlyTotals, yearlyTotals } = computeAggregateMaps(
        existingHostAnalytics?.dailyTotals,
        existingHostAnalytics?.monthlyTotals,
        existingHostAnalytics?.yearlyTotals,
        aggregateDate,
        1,
        revenueDelta,
        partnerCommission,
      );

      await prisma.hostAnalytics.upsert({
        where: { userId: listingWithSlug.user.id },
        update: {
          totalBooks: { increment: 1 },
          totalRevenue: { increment: revenueDelta },
          dailyTotals,
          monthlyTotals,
          yearlyTotals,
        },
        create: {
          userId: listingWithSlug.user.id,
          totalBooks: 1,
          totalRevenue: revenueDelta,
          dailyTotals,
          monthlyTotals,
          yearlyTotals,
        },
      });
    }

    // ✅ Track host earnings
    // await prisma.earning.create({
    //   data: {
    //     userId: listingWithSlug.user.id,
    //     amount: totalPrice * 0.9,
    //     totalBooks: 1,
    //     reservationId: reservation.id,
    //     role: Role.host,
    //   }
    // });

    // ✅ Track promoter earnings if applicable
        // ✅ Track promoter earnings if applicable
    if (referralId) {
      const promoterUser = await prisma.user.findFirst({
        where: { referenceId: referralId },
      });

      if (promoterUser?.id) {
        const promoterCut = totalPrice;

        // Track promoter earning
        await prisma.earning.create({
          data: {
            userId: promoterUser.id,
            amount: promoterCut,
            totalBooks: 1,
            reservationId: reservation.id,
            role: Role.promoter,
          },
        });

        // Update or create referral analytics for this promoter
        const promoterAnalytics = await prisma.referralAnalytics.findUnique({
          where: { userId: promoterUser.id },
        });
        
        const aggregateDateBase =
          reservation.startDate ?? new Date(`${startDate}T00:00:00.000Z`);
        const aggregateDate = new Date(
          Date.UTC(
            aggregateDateBase.getUTCFullYear(),
            aggregateDateBase.getUTCMonth(),
            aggregateDateBase.getUTCDate(),
          ),
        );

        // AFTER
        const { dailyTotals, monthlyTotals, yearlyTotals } = computeAggregateMaps(
          promoterAnalytics?.dailyTotals,
          promoterAnalytics?.monthlyTotals,
          promoterAnalytics?.yearlyTotals,
          aggregateDate, // ⬅️ use the same date as host analytics
          1,
          promoterCut,
          0,
        );

        if (promoterAnalytics) {
          await prisma.referralAnalytics.update({
            where: { userId: promoterUser.id },
            data: {
              totalBooks: { increment: 1 },
              totalRevenue: { increment: promoterCut },
              dailyTotals,
              monthlyTotals,
              yearlyTotals,
            },
          });
        } else {
          await prisma.referralAnalytics.create({
            data: {
              userId: promoterUser.id,
              totalBooks: 1,
              totalRevenue: promoterCut,
              qrScans: 0,
              dailyTotals,
              monthlyTotals,
              yearlyTotals,
            },
          });
        }
      }
    }
    
    await prisma.platformEconomy.create({
      data: {
        bookingCount: 1,
        revenue: totalPrice,
        reservationId: reservation.id,
        platformFee: totalPrice * 0.1, // 10% platform cut
      }
    });

    const formattedDateTime = (() => {
      try {
        const baseDate = new Date(startDate);
        const [hourStr, minuteStr] = selectedTime.split(':');
        baseDate.setHours(parseInt(hourStr));
        baseDate.setMinutes(parseInt(minuteStr));

        const datePart = baseDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

        const timePart = baseDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return `${datePart} ${timePart}`;
      } catch {
        return 'Unavailable';
      }
    })();

    const displayGuestName = currentUser?.name ?? legalName ?? 'Guest';
    const guestContact = currentUser?.contact ?? contact ?? '';

    const listingPath = hrefForListing(listingWithSlug as any);

    if (listingWithSlug?.user?.email) {
      await fetch(`${process.env.NEXTAUTH_URL}/api/email/notify-host`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostEmail: listingWithSlug.user.email,
          hostName: listingWithSlug.user.name,
          hostContact: listingWithSlug.user.contact || '',
          guestName: displayGuestName,       // <- properly resolved
          contact: guestContact,             // <- properly resolved
          total: totalPrice,
          guests: resolvedGuestCount,
          formattedDateTime,
          listingTitle: listingWithSlug.title,
          listingId: listingWithSlug.id,
          listingPath,
        }),
      });
    }


    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error creating reservation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}