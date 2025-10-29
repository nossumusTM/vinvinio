import { redirect, notFound } from "next/navigation";
import prisma from "@/app/libs/prismadb";
import ClientOnly from "@/app/components/ClientOnly";
import getCurrentUser from "@/app/actions/getCurrentUser";
import getListingReservations from "@/app/actions/getListingReservations";
import ListingClient from "@/app/listings/[listingId]/ListingClient";
import { canonicalSegmentsForListing, hrefForListing } from "@/app/libs/links";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";

export const dynamic = "force-dynamic";

type PageProps = { params: { category: string; slug: string } };

export async function generateMetadata({ params }: PageProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

  // No `select`; cast the `where` to any to bypass stale types
  const listing =
    (await prisma.listing.findFirst({
      where: { slug: params.slug } as any,
    })) ??
    (await prisma.listing.findUnique({
      where: { id: params.slug },
    }));

  if (!listing) return { title: "Experience not found" };

  const ensured = await ensureListingSlug(listing as any);
  const { categorySegment, slug } = canonicalSegmentsForListing(ensured);

  if (!slug) return { title: ensured.title };

  const canonical = `${baseUrl}/tours/${categorySegment}/${encodeURIComponent(slug)}`;

  const images = Array.isArray(ensured.imageSrc)
    ? ensured.imageSrc
    : ensured.imageSrc
      ? [ensured.imageSrc]
      : [];

  return {
    title: ensured.title,
    description: ensured.description,
    alternates: { canonical },
    openGraph: {
      title: ensured.title,
      description: ensured.description,
      url: canonical,
      images: images.slice(0, 4).map((url: string) => ({ url })),
      type: "article",
    },
  };
}

export default async function ListingBySlugPage({ params }: PageProps) {
  const { category, slug } = params;

  const listing =
    (await prisma.listing.findFirst({
      where: { slug } as any,
      include: { user: true },
    })) ??
    (await prisma.listing.findUnique({
      where: { id: slug },
      include: { user: true },
    }));

  if (!listing) return notFound();

  const ensured = await ensureListingSlug(listing as any);
  const { categorySegment, slug: canonicalSlug } = canonicalSegmentsForListing(ensured);

  if (!canonicalSlug) return notFound();

  const canonicalHref = hrefForListing(ensured);
  if (category !== categorySegment || slug !== canonicalSlug) {
    redirect(canonicalHref);
  }

  const currentUser = await getCurrentUser();
  const reservations = await getListingReservations(ensured.id);

  return (
    <ClientOnly>
      <ListingClient
        listing={ensured as any}
        reservations={reservations as any}
        currentUser={currentUser as any}
      />
    </ClientOnly>
  );
}
