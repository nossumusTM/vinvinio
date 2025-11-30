import prisma from "@/app/(marketplace)/libs/prismadb";
import { ensureListingSlug } from "@/app/(marketplace)/libs/ensureListingSlug";
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

  // 🔍 detect whether the param is an ObjectId or a slug
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(listingId);

  const listing = isObjectId
    ? await prisma.listing.findUnique({
        where: { id: listingId },
      })
    : await prisma.listing.findFirst({
        where: {
          OR: [
            { slug: listingId },
            { slug: decodeURIComponent(listingId) },
          ],
        },
      });

  if (!listing) {
    return notFound();
  }

  // ✅ make sure we have a slug stored / computed
  const ensured = await ensureListingSlug(listing);
  const slug = ensured.slug ?? listing.slug ?? listingId;

  // ✅ derive category segment from DB
  const rawCategory = Array.isArray(listing.category)
    ? listing.category[0]
    : listing.category ?? "General";

  const categorySegment =
    String(rawCategory)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "general";

  const canonicalHref = `/services/${categorySegment}/${slug}`;

  permanentRedirect(canonicalHref);
}
