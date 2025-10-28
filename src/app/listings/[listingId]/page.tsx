// app/listings/[listingId]/page.tsx
import prisma from "@/app/libs/prismadb";
import getListingById from "@/app/actions/getListingById";
import getListingReservations from "@/app/actions/getListingReservations";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { redirect, notFound } from "next/navigation";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import ListingClient from "./ListingClient";

export const dynamic = "force-dynamic";

interface IParams {
  listingId?: string;
}

function canonicalCategoryFrom(listing: { category?: string[] | null }) {
  return Array.isArray(listing.category) && listing.category.length > 0
    ? listing.category[0]
    : "general";
}

const ListingPage = async ({ params }: { params: IParams }) => {
  const listingId = params.listingId;
  if (!listingId) return notFound();

  // 1) Try to redirect if we have a slug (preferred path)
  //    No `select` -> avoids TS complaining if your Prisma types are stale.
  const raw = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!raw) return notFound();

  const l = raw as any; // runtime doc contains slug/category even if types lag behind
  if (l.slug && typeof l.slug === "string" && l.slug.trim().length > 0) {
    const category = canonicalCategoryFrom(l);
    redirect(`/tours/${encodeURIComponent(category)}/${encodeURIComponent(l.slug)}`);
  }

  // 2) Fallback: render legacy page (for records without slug yet)
  const listing = await getListingById({ listingId });
  const currentUser = await getCurrentUser();
  const reservations = await getListingReservations(listingId);

  if (!listing) {
    return (
      <ClientOnly>
        <EmptyState />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <ListingClient
        listing={listing}
        reservations={reservations}
        currentUser={currentUser}
      />
    </ClientOnly>
  );
};

export default ListingPage;
