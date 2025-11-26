import { NextResponse } from "next/server";

import prisma from "@/app/(marketplace)/libs/prismadb";

interface Params {
  listingId?: string;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim()).filter(Boolean);
    if (ips.length > 0) {
      return ips[0];
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // fallback to remote address if available
  const remoteAddress = (request as any)?.ip || (request as any)?.socket?.remoteAddress;
  if (typeof remoteAddress === "string" && remoteAddress.length > 0) {
    return remoteAddress;
  }

  return null;
}

export async function POST(request: Request, { params }: { params: Params }) {
  const listingId = params.listingId;

  if (!listingId) {
    return new NextResponse("Listing ID is required", { status: 400 });
  }

  const ip = getClientIp(request);
  const ipAddress = ip ?? "unknown";

  try {
    const updatedListing = await prisma.$transaction(async (tx) => {
      // ensure the listing exists first to return a proper 404 below
      await tx.listing.findUniqueOrThrow({ where: { id: listingId }, select: { id: true } });

      // record the view for this IP, letting the unique constraint guard duplicates
      await tx.listingView.create({
        data: { listingId, ip: ipAddress },
      });

      return tx.listing.update({
        where: { id: listingId },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });
    });

    return NextResponse.json({ viewCount: updatedListing.viewCount });
  } catch (error: any) {
    // P2002 = unique constraint violated (already counted this IP)
    if (error?.code === "P2002") {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { viewCount: true },
      });

      if (!listing) {
        return new NextResponse("Listing not found", { status: 404 });
      }

      return NextResponse.json({ viewCount: listing.viewCount });
    }

    if (error?.code === "P2025") {
      return new NextResponse("Listing not found", { status: 404 });
    }

    console.error("[LISTING_VIEW_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}