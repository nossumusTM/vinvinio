import prisma from "@/app/(marketplace)/libs/prismadb";
import {
  MAX_PARTNER_POINT_VALUE,
  MIN_PARTNER_COMMISSION,
  computePartnerCommission,
  computePuntiFromCommission,
  computePuntiShare,
  getPuntiLabel,
  sanitizePartnerCommission,
} from "@/app/(marketplace)/constants/partner";

export type PartnerMetrics = {
  punti: number;
  puntiShare: number;
  puntiLabel: ReturnType<typeof getPuntiLabel>;
  partnerCommission: number;
};

const deriveMetrics = (
  commission: number | null | undefined,
  puntiValues: number[],
): PartnerMetrics => {
  // const highestListingPunti = puntiValues.reduce((max, value) => {
  //   if (!Number.isFinite(value)) return max;
  //   return Math.max(max, Math.max(0, Math.floor(value)));
  // }, 0);
  const totalListingPunti = puntiValues.reduce((sum, value) => {
    if (!Number.isFinite(value)) return sum;
    return sum + Math.max(0, Math.floor(value));
  }, 0);

  const sanitizedCommission =
    typeof commission === "number" && Number.isFinite(commission)
      ? sanitizePartnerCommission(commission)
      : null;

  // const puntiFromCommission = sanitizedCommission !== null ? computePuntiFromCommission(sanitizedCommission) : 0;
  const partnerCommission =
    sanitizedCommission !== null ? sanitizedCommission : MIN_PARTNER_COMMISSION;

  const commissionPunti =
    sanitizedCommission !== null ? computePuntiFromCommission(sanitizedCommission) : 0;
  const punti = Math.min(
    MAX_PARTNER_POINT_VALUE,
    Math.max(0, totalListingPunti) + commissionPunti,
  );

  const puntiShare = computePuntiShare(punti);
  const puntiLabel = getPuntiLabel(punti);

  return {
    punti,
    partnerCommission,
    puntiShare,
    puntiLabel,
  };
};

export const resolvePartnerMetricsForHost = async (userId: string): Promise<PartnerMetrics> => {
  if (!userId) {
    return {
      punti: 0,
      partnerCommission: MIN_PARTNER_COMMISSION,
      puntiShare: 0,
      puntiLabel: getPuntiLabel(0),
    };
  }

  const [listings, existingCommission] = await Promise.all([
    prisma.listing.findMany({
      where: {
        userId,
        status: "approved",
      },
      select: { punti: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { partnerCommission: true },
    }),
  ]);

  const metrics = deriveMetrics(
    existingCommission?.partnerCommission,
    listings.map((listing) => listing.punti ?? 0),
  );

  return metrics;
};

export const updateListingPunti = async (listingId: string, punti: number) => {
  const sanitizedPunti = Math.max(0, Math.min(MAX_PARTNER_POINT_VALUE, Math.floor(punti)));

  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: { punti: sanitizedPunti },
    select: { userId: true },
  });

  const metrics = await resolvePartnerMetricsForHost(listing.userId);

  return {
    listingId,
    punti: sanitizedPunti,
    userId: listing.userId,
    metrics,
  };
};

export const ensureListingApprovalPunti = async (listingId: string) => {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { punti: true, userId: true },
  });

  if (!listing) {
    return null;
  }

  const nextPunti = listing.punti < 2 ? 2 : listing.punti ?? 0;
  const sanitizedPunti = Math.max(0, Math.min(MAX_PARTNER_POINT_VALUE, Math.floor(nextPunti)));

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: {
      punti: sanitizedPunti,
    },
    select: { userId: true, punti: true },
  });

  const metrics = await resolvePartnerMetricsForHost(updated.userId);

  return {
    punti: updated.punti,
    metrics,
  };
};

export const updateHostPartnerCommission = async (userId: string, commission: number) => {
  const sanitizedCommission = sanitizePartnerCommission(commission);

  await prisma.user.update({
    where: { id: userId },
    data: { partnerCommission: sanitizedCommission },
  });

  const metrics = await resolvePartnerMetricsForHost(userId);

  return {
    userId,
    metrics,
  };
};