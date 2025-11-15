import { NextResponse } from "next/server";

import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import prisma from "@/app/(marketplace)/libs/prismadb";
import { updateHostPartnerCommission } from "@/app/(marketplace)/libs/partnerMetrics";
import { sanitizePartnerCommission } from "@/app/(marketplace)/constants/partner";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "host") {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { partnerCommission } = await request.json();

    if (!Number.isFinite(Number(partnerCommission))) {
      return new NextResponse("Invalid commission", { status: 400 });
    }

    const sanitizedCommission = sanitizePartnerCommission(Number(partnerCommission));
    const { metrics } = await updateHostPartnerCommission(currentUser.id, sanitizedCommission);

    const analytics = await prisma.hostAnalytics.findUnique({
      where: { userId: currentUser.id },
    });

    return NextResponse.json({
      totalBooks: analytics?.totalBooks ?? 0,
      totalRevenue: analytics?.totalRevenue ?? 0,
      partnerCommission: metrics.partnerCommission,
      punti: metrics.punti,
      puntiShare: metrics.puntiShare,
      puntiLabel: metrics.puntiLabel,
    });
  } catch (error) {
    console.error("[HOST_COMMISSION_UPDATE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}