export type PricingMode = 'fixed' | 'group' | 'custom';

export interface PricingTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

export interface PricingSnapshot {
  mode: PricingMode;
  basePrice: number;
  groupPrice: number | null;
  groupSize: number | null;
  tiers: PricingTier[];
}

const ALLOWED_MODES: PricingMode[] = ['fixed', 'group', 'custom'];

const toPositiveInteger = (value: unknown): number | null => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return Math.round(numeric);
};

const normalizeTier = (tier: unknown): PricingTier | null => {
  if (!tier || typeof tier !== 'object') {
    return null;
  }

  const record = tier as Record<string, unknown>;

  const minGuests = toPositiveInteger(
    record.minGuests ?? record.min ?? record.from ?? record.start ?? null,
  );
  const maxGuests = toPositiveInteger(
    record.maxGuests ?? record.max ?? record.to ?? record.end ?? null,
  );
  const price = toPositiveInteger(record.price ?? record.amount ?? record.cost ?? null);

  if (!minGuests || !maxGuests || !price || maxGuests < minGuests) {
    return null;
  }

  return {
    minGuests,
    maxGuests,
    price,
  };
};

export const normalizePricingSnapshot = (
  rawSnapshot: unknown,
  fallbackPrice?: number,
): PricingSnapshot => {
  const defaultBasePrice = toPositiveInteger(fallbackPrice) ?? 0;

  const baseSnapshot: PricingSnapshot = {
    mode: 'fixed',
    basePrice: defaultBasePrice,
    groupPrice: null,
    groupSize: null,
    tiers: [],
  };

  if (!rawSnapshot) {
    return baseSnapshot;
  }

  if (Array.isArray(rawSnapshot)) {
    const tiers = rawSnapshot
      .map(normalizeTier)
      .filter((tier): tier is PricingTier => tier !== null)
      .sort((a, b) => a.minGuests - b.minGuests);

    if (tiers.length === 0) {
      return baseSnapshot;
    }

    return {
      ...baseSnapshot,
      mode: 'custom',
      tiers,
    };
  }

  if (typeof rawSnapshot === 'object') {
    const record = rawSnapshot as Record<string, unknown>;

    const modeCandidate = record.mode ?? record.type ?? record.pricingType ?? record.pricingMode;
    const normalizedMode =
      typeof modeCandidate === 'string' && ALLOWED_MODES.includes(modeCandidate as PricingMode)
        ? (modeCandidate as PricingMode)
        : baseSnapshot.mode;

    const basePriceCandidate = toPositiveInteger(
      record.basePrice ?? record.price ?? fallbackPrice ?? baseSnapshot.basePrice,
    );

    const groupPriceCandidate = toPositiveInteger(
      record.groupPrice ?? record.group_price ?? record.groupRate ?? null,
    );

    const groupSizeCandidate = toPositiveInteger(
      record.groupSize ?? record.group_size ?? record.groupCount ?? null,
    );

    const tiersSource =
      record.tiers ?? record.customPricing ?? record.pricingTiers ?? record.levels ?? null;

    const tiers = Array.isArray(tiersSource)
      ? tiersSource
          .map(normalizeTier)
          .filter((tier): tier is PricingTier => tier !== null)
          .sort((a, b) => a.minGuests - b.minGuests)
      : [];

    const snapshot: PricingSnapshot = {
      mode: normalizedMode,
      basePrice: basePriceCandidate ?? baseSnapshot.basePrice,
      groupPrice: groupPriceCandidate ?? null,
      groupSize: groupSizeCandidate ?? null,
      tiers,
    };

    if (snapshot.mode === 'group' && (!snapshot.groupPrice || !snapshot.groupSize)) {
      snapshot.mode = 'fixed';
      snapshot.groupPrice = null;
      snapshot.groupSize = null;
    }

    if (snapshot.mode !== 'custom' && snapshot.tiers.length > 0) {
      snapshot.mode = 'custom';
    }

    if (!snapshot.basePrice || snapshot.basePrice <= 0) {
      snapshot.basePrice = baseSnapshot.basePrice;
    }

    return snapshot;
  }

  return baseSnapshot;
};

export const PRICING_MODES_SET = new Set<PricingMode>(ALLOWED_MODES);

