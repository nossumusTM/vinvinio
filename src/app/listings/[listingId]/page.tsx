import prisma from "@/app/libs/prismadb";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";
import { hrefForListing } from "@/app/libs/links";
import { permanentRedirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageParams {
  listingId?: string;
}

export default async function LegacyListingPage({
  params,
}: {
  params: PageParams;
}) {
  const listingId = params.listingId;

  if (!listingId) {
    return notFound();
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    return notFound();
  }

  const ensured = await ensureListingSlug(listing);
  const canonicalHref = hrefForListing({
    ...ensured,
    id: listingId,
  });

  permanentRedirect(canonicalHref);
}
