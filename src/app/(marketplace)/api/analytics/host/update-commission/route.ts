// src/app/api/analytics/host/update-commission/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/(marketplace)/libs/prismadb";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import { sanitizePartnerCommission } from "@/app/(marketplace)/constants/partner";
import {
  CommissionChangeLimitError,
  updateHostPartnerCommission,
} from "@/app/(marketplace)/libs/partnerMetrics";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "host") {
      return NextResponse.json(
        { message: "Not authorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Accept both keys for safety
    const rawCommission = Number(body.commission ?? body.partnerCommission);

    if (!Number.isFinite(rawCommission)) {
      return NextResponse.json(
        { message: "Commission must be a number" },
        { status: 400 }
      );
    }

    //     const partnerCommission = Math.min(
    //   MAX_PARTNER_COMMISSION,
    //   Math.max(MIN_PARTNER_COMMISSION, rawCommission)
    // );
    const sanitizedCommission = sanitizePartnerCommission(rawCommission);

    // 1) update on User (source of truth)
    // const updatedUser = await prisma.user.update({
    //   where: { id: currentUser.id },
    //   data: {
    //     partnerCommission,
    //   },
    //   select: {
    //     id: true,
    //     partnerCommission: true,
    //   },
    // });
    const { metrics, platformRelevance } = await updateHostPartnerCommission(
      currentUser.id,
      sanitizedCommission,
    );

    // 2) ensure HostAnalytics row exists, but DO NOT touch unknown fields like `punti`
    const analytics = await prisma.hostAnalytics.upsert({
      where: { userId: currentUser.id },
      update: {},
      create: { userId: currentUser.id, totalBooks: 0, totalRevenue: 0 },
    });

    // 3) derive punti info from commission (no DB fields needed)
    // const punti = computePuntiFromCommission(updatedUser.partnerCommission);
    // const puntiShare = computePuntiShare(punti);
    // const puntiLabel = getPuntiLabel(punti);

    // const partnerMetrics = await resolvePartnerMetricsForHost(currentUser.id);



    return NextResponse.json({
      totalBooks: analytics.totalBooks,
      totalRevenue: analytics.totalRevenue,
      // partnerCommission: updatedUser.partnerCommission,
      // punti,
      // puntiShare,
      // puntiLabel,
      partnerCommission: metrics.partnerCommission,
      punti: metrics.punti,
      puntiShare: metrics.puntiShare,
      puntiLabel: metrics.puntiLabel,
      platformRelevance,
    });

  } catch (err) {
    if (err instanceof CommissionChangeLimitError) {
      return NextResponse.json({ message: err.message }, { status: 429 });
    }
    console.error("❌ Error updating host commission:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
