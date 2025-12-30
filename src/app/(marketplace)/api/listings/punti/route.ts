import { NextResponse } from "next/server";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import { updateListingPunti } from "@/app/(marketplace)/libs/partnerMetrics";
import { MAX_PARTNER_POINT_VALUE } from "@/app/(marketplace)/constants/partner";
import prisma from "@/app/(marketplace)/libs/prismadb";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  // if (!currentUser || currentUser.role !== "moder") {
  if (!currentUser) {
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

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    });

    if (!listing) {
      return new NextResponse("Listing not found", { status: 404 });
    }

    const isOwner = currentUser.role === "host" && listing.userId === currentUser.id;
    const isModerator = currentUser.role === "moder";

    if (!isOwner && !isModerator) {
      return new NextResponse("Unauthorized", { status: 403 });
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
    if (error?.code === "P2026" || error?.message === "Listing not found") {
      return new NextResponse("Listing not found", { status: 404 });
    }

    console.error("[MODER_LISTING_PUNTI]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}