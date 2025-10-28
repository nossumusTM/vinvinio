import { redirect, notFound } from "next/navigation";
import prisma from "@/app/libs/prismadb";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import getCurrentUser from "@/app/actions/getCurrentUser";
import getListingReservations from "@/app/actions/getListingReservations";
import ListingClient from "@/app/listings/[listingId]/ListingClient";

export const dynamic = "force-dynamic";

type PageProps = { params: { category: string; slug: string } };

function canonicalCategoryFrom(listing: { category: string[] | null | undefined }) {
  return Array.isArray(listing.category) && listing.category.length > 0
    ? listing.category[0]
    : "general";
}

export async function generateMetadata({ params }: PageProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

  // No `select`; cast the `where` to any to bypass stale types
  const listing = await prisma.listing.findFirst({
    where: { slug: params.slug } as any,
  });

  if (!listing) return { title: "Experience not found" };

  const l = listing as any; // runtime object DOES have slug
  const canonicalCategory = canonicalCategoryFrom(l);
  const canonical = `${baseUrl}/tours/${encodeURIComponent(canonicalCategory)}/${encodeURIComponent(l.slug)}`;

  const images = Array.isArray(l.imageSrc) ? l.imageSrc : l.imageSrc ? [l.imageSrc] : [];

  return {
    title: l.title,
    description: l.description,
    alternates: { canonical },
    openGraph: {
      title: l.title,
      description: l.description,
      url: canonical,
      images: images.slice(0, 4).map((url: string) => ({ url })),
      type: "article",
    },
  };
}

export default async function ListingBySlugPage({ params }: PageProps) {
  const { category, slug } = params;

  // No `select`; cast the `where` to any to bypass stale types
  const listing = await prisma.listing.findFirst({
    where: { slug } as any,
    include: { user: true },
  });

  if (!listing) return notFound();

  const l = listing as any; // runtime object DOES have slug
  const canonicalCategory = canonicalCategoryFrom(l);
  if (canonicalCategory !== category) {
    redirect(`/tours/${encodeURIComponent(canonicalCategory)}/${encodeURIComponent(l.slug)}`);
  }

  const currentUser = await getCurrentUser();
  const reservations = await getListingReservations(l.id);

  return (
    <ClientOnly>
      <ListingClient
        listing={l}
        reservations={reservations as any}
        currentUser={currentUser as any}
      />
    </ClientOnly>
  );
}
