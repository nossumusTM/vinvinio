import { redirect, notFound } from "next/navigation";
import prisma from "@/app/(marketplace)/libs/prismadb";
import ClientOnly from "@/app/(marketplace)/components/ClientOnly";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import getListingReservations from "@/app/(marketplace)/actions/getListingReservations";
import ListingClient from "@/app/(marketplace)/listings/[listingId]/ListingClient";
import { canonicalSegmentsForListing, hrefForListing } from "@/app/(marketplace)/libs/links";
import { ensureListingSlug } from "@/app/(marketplace)/libs/ensureListingSlug";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { category: string; slug: string };
  searchParams?: { lid?: string | string[] };
};

function extractListingId(searchParams?: { lid?: string | string[] }) {
  const raw = searchParams?.lid;
  if (!raw) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

  // No `select`; cast the `where` to any to bypass stale types
  const listing =
    (await prisma.listing.findFirst({
      where: { slug: params.slug } as any,
    })) ??
    (await prisma.listing.findUnique({
      where: { id: params.slug },
    })) ??
    (await prisma.listing.findUnique({
      where: { id: extractListingId(searchParams) },
    }));

  if (!listing) return { title: "Service not found" };

  const ensured = await ensureListingSlug(listing as any);
  const { categorySegment, slug } = canonicalSegmentsForListing(ensured);

  if (!slug) return { title: ensured.title };

  const canonical = `${baseUrl}/services/${categorySegment}/${encodeURIComponent(slug)}`;

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

export default async function ListingBySlugPage({ params, searchParams }: PageProps) {
  const { category, slug } = params;
  const fallbackId = extractListingId(searchParams);

  const listing =
    (await prisma.listing.findFirst({
      where: { slug } as any,
      include: { user: true },
    })) ??
    (await prisma.listing.findUnique({
      where: { id: slug },
      include: { user: true },
    })) ??
    (fallbackId
      ? await prisma.listing.findUnique({
          where: { id: fallbackId },
          include: { user: true },
        })
      : null);

  if (!listing) return notFound();

  const ensured = await ensureListingSlug(listing as any);
  const { categorySegment, slug: canonicalSlug } = canonicalSegmentsForListing(ensured);

  if (!canonicalSlug) return notFound();

  const canonicalHref = hrefForListing(ensured);
  if (category !== categorySegment || slug !== canonicalSlug) {
    redirect(canonicalHref);
  }

  const currentUser = await getCurrentUser();
  const existingLike = currentUser
    ? await prisma.listingLike.findFirst({
        where: { listingId: ensured.id, userId: currentUser.id },
      })
    : null;
  const listingWithEngagement = {
    ...(ensured as any),
    likedByCurrentUser: Boolean(existingLike),
    bookingCount: await prisma.reservation.count({
      where: { listingId: ensured.id, status: { not: 'cancelled' } },
    }),
  };
  const reservations = await getListingReservations(ensured.id);

  return (
    <ClientOnly>
      <ListingClient
        listing={listingWithEngagement as any}
        reservations={reservations as any}
        currentUser={currentUser as any}
      />
    </ClientOnly>
  );
}
