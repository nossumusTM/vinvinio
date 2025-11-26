import { NextResponse } from "next/server";
import prisma from "@/app/(marketplace)/libs/prismadb";

interface Params {
  listingId?: string;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
    if (ips.length > 0) {
      return ips[0];
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const remoteAddress =
    (request as any)?.ip || (request as any)?.socket?.remoteAddress;
  if (typeof remoteAddress === "string" && remoteAddress.length > 0) {
    return remoteAddress;
  }

  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Params },
) {
  const listingId = params.listingId;

  if (!listingId) {
    return new NextResponse("Listing ID is required", { status: 400 });
  }

  const ip = getClientIp(request);
  const ipAddress = ip ?? "unknown";

  try {
    // make sure listing exists (we don't need viewCount here)
    const existingListing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });

    if (!existingListing) {
      return new NextResponse("Listing not found", { status: 404 });
    }

    // transactional: insert view (or hit unique), then count views
    const { viewCount } = await prisma.$transaction(async (tx) => {
      await tx.listingView.create({
        data: { listingId, ip: ipAddress },
      });

      // derive count from ListingView
      const count = await tx.listingView.count({
        where: { listingId },
      });

      return { viewCount: count };
    });

    return NextResponse.json({ viewCount });
  } catch (error: any) {
    // unique violation = this IP already viewed; just return current count
    if (error?.code === "P2002") {
      const viewCount = await prisma.listingView.count({
        where: { listingId },
      });

      return NextResponse.json({ viewCount });
    }

    if (error?.code === "P2025") {
      return new NextResponse("Listing not found", { status: 404 });
    }

    console.error("[LISTING_VIEW_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
