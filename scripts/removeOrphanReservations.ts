// scripts/removeOrphanReservations.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔎 Scanning for orphan reservations…');

  // 1) Fetch all existing listing IDs
  const listings = await prisma.listing.findMany({
    select: { id: true },
  });
  const validListingIds = new Set(listings.map((l) => l.id));

  // 2) Fetch all reservations (only id + listingId)
  const reservations = await prisma.reservation.findMany({
    select: {
      id: true,
      listingId: true,
    },
  });

  // 3) Find reservations whose listingId is not in the valid set
  const orphanReservations = reservations.filter(
    (r) => !validListingIds.has(r.listingId)
  );

  if (orphanReservations.length === 0) {
    console.log('✅ No orphan reservations found.');
    return;
  }

  const orphanIds = orphanReservations.map((r) => r.id);

  console.log(`⚠️ Found ${orphanIds.length} orphan reservations:`);
  console.log(orphanIds);

  const deletedReviews = await prisma.review.deleteMany({
    where: {
      reservationId: { in: orphanIds },
    },
  });

  console.log(`🧽 Deleted ${deletedReviews.count} reviews linked to orphan reservations.`);

  const result = await prisma.reservation.deleteMany({
    where: {
      id: { in: orphanIds },
    },
  });

  console.log(`🧹 Deleted ${result.count} orphan reservations.`);
}

main()
  .catch((err) => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
