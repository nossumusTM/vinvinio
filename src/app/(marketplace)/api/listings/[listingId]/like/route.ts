import { NextResponse } from "next/server";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import prisma from "@/app/(marketplace)/libs/prismadb";

interface Params {
  listingId?: string;
}

export async function POST(request: Request, { params }: { params: Params }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const listingId = params.listingId;

  if (!listingId) {
    return new NextResponse("Listing ID is required", { status: 400 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });

  if (!listing) {
    return new NextResponse("Listing not found", { status: 404 });
  }

  try {
    await prisma.listingLike.create({
      data: {
        listingId,
        userId: currentUser.id,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ liked: true, likesCount: listing.likesCount ?? 0 });
    }
    console.error("[LISTING_LIKE_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  const updatedListing = await prisma.listing.update({
    where: { id: listingId },
    data: {
      likesCount: { increment: 1 },
    },
    select: { likesCount: true },
  });

  return NextResponse.json({ liked: true, likesCount: updatedListing.likesCount });
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const listingId = params.listingId;

  if (!listingId) {
    return new NextResponse("Listing ID is required", { status: 400 });
  }

  const deletion = await prisma.listingLike.deleteMany({
    where: {
      listingId,
      userId: currentUser.id,
    },
  });

  if (deletion.count === 0) {
    return NextResponse.json({ liked: false, likesCount: listingId ? undefined : 0 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { likesCount: true } });
  const nextCount = Math.max(0, (listing?.likesCount ?? 0) - deletion.count);

  const updatedListing = await prisma.listing.update({
    where: { id: listingId },
    data: {
      likesCount: nextCount,
    },
    select: { likesCount: true },
  });

  return NextResponse.json({ liked: false, likesCount: updatedListing.likesCount });
}