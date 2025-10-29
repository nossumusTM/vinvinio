export const dynamic = 'force-dynamic';
import prisma from "@/app/libs/prismadb";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";

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

    return {
      ...listingWithSlug,
      createdAt: listingWithSlug.createdAt.toString(),
      user: {
        ...listingWithSlug.user,
        createdAt: listingWithSlug.user.createdAt.toString(),
        updatedAt: listingWithSlug.user.updatedAt.toString(),
        emailVerified: listingWithSlug.user.emailVerified?.toString() || null,
      },
    };
  } catch (error: any) {
    throw new Error(error);
  }
}
