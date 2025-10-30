// app/api/listings/pending/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const pendingListings = await prisma.listing.findMany({
      where: {
        status: 'pending',
      },
      include: {
        user: true,
      },
    });

    const listingsWithSlug = await Promise.all(
      pendingListings.map((listing) => ensureListingSlug(listing))
    );

    return NextResponse.json(listingsWithSlug);
  } catch (error) {
    console.error("[FETCH_PENDING_LISTINGS]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}