import { PricingMode, PricingTier } from "./pricing";
import { SafeListing } from "../types";

export type ListingLike = Pick<
  SafeListing,
  "price" | "pricingType" | "groupPrice" | "groupSize" | "customPricing" | "guestCount"
>;

export type PricingComputation = {
  mode: PricingMode;
  unitPrice: number;
  totalPrice: number;
  suffix: string;
  descriptor?: string;
  tier?: PricingTier | null;
};

const normalizeMode = (pricingType: ListingLike["pricingType"]): PricingMode => {
  if (pricingType === "group" || pricingType === "custom") {
    return pricingType;
  }
  return "fixed";
};

const sortedTiers = (tiers: ListingLike["customPricing"]): PricingTier[] =>
  Array.isArray(tiers)
    ? [...tiers].sort((a, b) => a.minGuests - b.minGuests)
    : [];

const pickTierForGuests = (tiers: PricingTier[], guestCount: number): PricingTier | null => {
  if (tiers.length === 0) return null;

  const direct = tiers.find(
    (tier) => guestCount >= tier.minGuests && guestCount <= tier.maxGuests,
  );
  if (direct) return direct;

  const before = tiers.find((tier) => guestCount < tier.minGuests);
  if (before) return before;

  return tiers[tiers.length - 1];
};

export const computePricingForGuests = (
  listing: ListingLike,
  guestCount: number,
): PricingComputation => {
  const mode = normalizeMode(listing.pricingType);
  const safeGuests = Number.isFinite(guestCount) && guestCount > 0 ? guestCount : 1;
  const tiers = sortedTiers(listing.customPricing);

  if (mode === "group" && listing.groupPrice) {
    return {
      mode: "group",
      unitPrice: listing.groupPrice,
      totalPrice: listing.groupPrice,
      suffix: "/ group",
      descriptor: listing.groupSize ? `Up to ${listing.groupSize} guests` : undefined,
      tier: null,
    };
  }

  if (mode === "custom" && tiers.length > 0) {
    const tier = pickTierForGuests(tiers, safeGuests);
    const unitPrice = tier?.price ?? listing.price;

    return {
      mode: "custom",
      unitPrice,
      totalPrice: unitPrice * safeGuests,
      suffix: "/ person",
      descriptor: tier ? `${tier.minGuests}-${tier.maxGuests} guests` : undefined,
      tier,
    };
  }

  const unitPrice = listing.price ?? 0;
  return {
    mode: "fixed",
    unitPrice,
    totalPrice: unitPrice * safeGuests,
    suffix: "/ person",
    descriptor: undefined,
    tier: null,
  };
};

export const getDisplayPricing = (listing: ListingLike): PricingComputation => {
  const normalizedMode = normalizeMode(listing.pricingType);
  const defaultGuests = normalizedMode === "group"
    ? listing.groupSize ?? listing.guestCount ?? 1
    : 1;

  return computePricingForGuests(listing, defaultGuests);
};