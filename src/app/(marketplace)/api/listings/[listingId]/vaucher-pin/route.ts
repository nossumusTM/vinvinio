import { NextResponse } from "next/server";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import prisma from "@/app/(marketplace)/libs/prismadb";

interface IParams {
  listingId?: string;
}

export async function POST(
  request: Request,
  { params }: { params: IParams }
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const listingId = params?.listingId;
  if (!listingId || typeof listingId !== "string") {
    return new NextResponse("Invalid listing ID", { status: 400 });
  }

  const body = await request.json();
  const pinned = Boolean(body?.pinned);

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing || listing.userId !== currentUser.id) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: { giftVoucherPinned: pinned },
  });

  return NextResponse.json(updated);
}