import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import prisma from "@/app/(marketplace)/libs/prismadb";
import { ensureListingSlug } from "@/app/(marketplace)/libs/ensureListingSlug";
import {
  ListingValidationError,
  normalizeListingUpdatePayload,
} from "@/app/(marketplace)/api/listings/validation";
import type { ListingStatus } from "@/app/(marketplace)/api/listings/validation";

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

    const listingWithSlug = await ensureListingSlug(listing);

    return NextResponse.json(listingWithSlug);
  } catch (error) {
    console.error("[LISTING_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: IParams }
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const listingId = params?.listingId;

  if (!listingId || typeof listingId !== 'string') {
    return new NextResponse('Invalid listing ID', { status: 400 });
  }

  const existingListing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!existingListing || existingListing.userId !== currentUser.id) {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  const body = await request.json();

    try {
      const normalized = normalizeListingUpdatePayload(body, {
        status: existingListing.status as ListingStatus,
        primaryCategory: existingListing.primaryCategory,
      });

    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        ...normalized.data,
        status: normalized.nextStatus,
        pricingType: normalized.pricingMode,
        groupPrice: normalized.pricingMode === 'group' ? normalized.groupPrice : null,
        groupSize: normalized.pricingMode === 'group' ? normalized.groupSize : null,
      } as any,
      include: { user: true },
    });

    const listingWithSlug = await ensureListingSlug(updatedListing);

    return NextResponse.json(listingWithSlug);
  } catch (error) {
    if (error instanceof ListingValidationError) {
      return new NextResponse(error.message, { status: error.status });
    }

    console.error('[LISTING_PATCH_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
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
