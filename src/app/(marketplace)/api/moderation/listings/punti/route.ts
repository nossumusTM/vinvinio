import { NextResponse } from "next/server";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import { updateListingPunti } from "@/app/(marketplace)/libs/partnerMetrics";
import { MAX_PARTNER_POINT_VALUE } from "@/app/(marketplace)/constants/partner";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "moder") {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { listingId, punti, puntiToAdd } = await request.json();

    if (!listingId || typeof listingId !== "string") {
      return new NextResponse("Listing ID is required", { status: 400 });
    }

    const puntiValue = Number(puntiToAdd ?? punti);
    if (!Number.isFinite(puntiValue)) {
      return new NextResponse("Invalid punti value", { status: 400 });
    }

    const result = await updateListingPunti(listingId, puntiValue);

    return NextResponse.json({
      message: "Listing punti updated",
      listingId: result.listingId,
      punti: result.punti,
      puntiAdded: result.puntiAdded,
      userId: result.userId,
      metrics: result.metrics,
      maxPointValue: MAX_PARTNER_POINT_VALUE,
    });
  } catch (error: any) {
    if (error?.code === "P2025" || error?.message === "Listing not found") {
      return new NextResponse("Listing not found", { status: 404 });
    }

    console.error("[MODER_LISTING_PUNTI]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}