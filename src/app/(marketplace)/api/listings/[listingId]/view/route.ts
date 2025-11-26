import { NextResponse } from "next/server";

import prisma from "@/app/(marketplace)/libs/prismadb";

interface Params {
  listingId?: string;
}

export async function POST(request: Request, { params }: { params: Params }) {
  const listingId = params.listingId;

  if (!listingId) {
    return new NextResponse("Listing ID is required", { status: 400 });
  }

  try {
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return NextResponse.json({ viewCount: updatedListing.viewCount });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return new NextResponse("Listing not found", { status: 404 });
    }

    console.error("[LISTING_VIEW_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}