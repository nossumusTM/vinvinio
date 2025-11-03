export const dynamic = 'force-dynamic';
import prisma from "@/app/libs/prismadb";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";
import { toSafeListing } from "@/app/libs/serializers";

interface IParams {
  listingId?: string;
}

export default async function getListingById(params: IParams) {
  try {
    const { listingId } = params;

    const listing = await prisma.listing.findUnique({
      where: {
        id: listingId,
      },
      include: {
        user: true,
      },
    });

    if (!listing) {
      return null;
    }

    const listingWithSlug = await ensureListingSlug(listing);

    return toSafeListing(listingWithSlug);
  } catch (error) {
    console.error("[GET_LISTING_BY_ID]", error);
    throw (error instanceof Error ? error : new Error(String(error)));
  }
}
