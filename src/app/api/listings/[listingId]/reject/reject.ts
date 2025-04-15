// app/api/listings/[listingId]/reject.ts
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";

interface IParams {
  listingId?: string;
}

export async function POST(
  req: Request,
  { params }: { params: IParams }
) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const listingId = params.listingId;

  if (!listingId || typeof listingId !== "string") {
    return new NextResponse("Invalid listing ID", { status: 400 });
  }

  try {
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'rejected' },
    });

    return NextResponse.json(updatedListing);
  } catch (error) {
    console.error("[REJECT_LISTING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}