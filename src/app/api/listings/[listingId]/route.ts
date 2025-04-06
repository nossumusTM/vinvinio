import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

interface IParams {
  listingId?: string;
}

export async function GET(
  request: Request,
  { params }: { params: IParams }
) {
  const listingId = params?.listingId;

  // ✅ Defensive check
  if (!listingId || typeof listingId !== "string" || listingId === "undefined") {
    return new NextResponse("Invalid listing ID", { status: 400 });
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true },
    });

    if (!listing) {
      return new NextResponse("Listing not found", { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("[LISTING_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: IParams }
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const { listingId } = params;

  if (!listingId || typeof listingId !== "string") {
    throw new Error("Invalid ID");
  }

  const listing = await prisma.listing.deleteMany({
    where: {
      id: listingId,
      userId: currentUser.id,
    },
  });

  return NextResponse.json(listing);
}
