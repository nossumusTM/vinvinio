// app/api/listings/pending/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";
import { toSafeListing } from "@/app/libs/serializers";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const [pendingListings, revisionListings] = await Promise.all([
      prisma.listing.findMany({
        where: {
          status: 'pending',
        },
        include: {
          user: true,
        },
      }),
      prisma.listing.findMany({
        where: {
          status: 'revision',
        },
        include: {
          user: true,
        },
      }),
    ]);

    const [pendingWithSlug, revisionWithSlug] = await Promise.all([
      Promise.all(pendingListings.map((listing) => ensureListingSlug(listing))),
      Promise.all(revisionListings.map((listing) => ensureListingSlug(listing))),
    ]);

    return NextResponse.json({
      pending: pendingWithSlug.map((listing) => toSafeListing(listing)),
      revision: revisionWithSlug.map((listing) => toSafeListing(listing)),
    });
  } catch (error) {
    console.error("[FETCH_PENDING_LISTINGS]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}