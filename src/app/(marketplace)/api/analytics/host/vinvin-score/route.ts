import { NextResponse } from "next/server";

import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import prisma from "@/app/(marketplace)/libs/prismadb";
import {
  MAX_PARTNER_POINT_VALUE,
  computePartnerCommission,
  computePuntiShare,
  getPuntiLabel,
  sanitizePartnerCommission
} from "@/app/(marketplace)/constants/partner";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "host") {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const body = await req.json();
    const rawVinvinScore = Number(body.vinvinScore);

    if (!Number.isFinite(rawVinvinScore)) {
      return NextResponse.json({ message: "VinVin score must be a number" }, { status: 400 });
    }

    const vinvinScore = Math.max(0, Math.min(MAX_PARTNER_POINT_VALUE, Math.floor(rawVinvinScore)));

    const safePartnerCommissionInput =
        typeof currentUser.partnerCommission === 'number'
            ? currentUser.partnerCommission
            : computePartnerCommission(vinvinScore);

    const partnerCommission = sanitizePartnerCommission(safePartnerCommissionInput);

    const vinvinScoreShare = computePuntiShare(vinvinScore);
    const vinvinScoreLabel = getPuntiLabel(vinvinScore);

    await prisma.$transaction([
      prisma.listing.updateMany({
        where: { userId: currentUser.id },
        data: { punti: vinvinScore },
      }),
    //   prisma.user.update({
    //     where: { id: currentUser.id },
    //     data: { partnerCommission },
    //   }),
    ]);

    return NextResponse.json({
      vinvinScore,
      vinvinScoreShare,
      vinvinScoreLabel,
      partnerCommission,
    });
  } catch (error) {
    console.error("Failed to update VinVin score", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}