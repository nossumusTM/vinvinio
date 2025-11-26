export const MAX_PARTNER_POINT_VALUE = 111;
export const MIN_PARTNER_COMMISSION = 15;
export const MAX_PARTNER_COMMISSION = 50;
export const PUNTI_PER_COMMISSION_STEP = 0.5;

export const sanitizePartnerCommission = (commission: number): number => {
  if (!Number.isFinite(commission)) {
    return MIN_PARTNER_COMMISSION;
  }

  const rounded = Math.round(commission);
  return Math.min(MAX_PARTNER_COMMISSION, Math.max(MIN_PARTNER_COMMISSION, rounded));
};

export const computePartnerCommission = (vinvinScore: number): number => {
  const normalized = Number.isFinite(vinvinScore) ? Math.max(0, Math.floor(vinvinScore)) : 0;
  // const commissionBoost = Math.floor(normalized / PUNTI_PER_COMMISSION_STEP);
  const commissionBoost = normalized / PUNTI_PER_COMMISSION_STEP;
  const rawCommission = MIN_PARTNER_COMMISSION + commissionBoost;
  // return Math.min(MAX_PARTNER_COMMISSION, rawCommission);
  return Math.min(MAX_PARTNER_COMMISSION, Math.round(rawCommission));
};

export const computePuntiFromCommission = (commission: number): number => {
  const sanitized = sanitizePartnerCommission(commission);
  // const puntiFromCommission = (sanitized - MIN_PARTNER_COMMISSION) * PUNTI_PER_COMMISSION_STEP;
  const puntiFromCommission = Math.round(
    (sanitized - MIN_PARTNER_COMMISSION) * PUNTI_PER_COMMISSION_STEP,
  );

  return Math.min(MAX_PARTNER_POINT_VALUE, Math.max(0, puntiFromCommission));
};

export const computePuntiShare = (vinvinScore: number): number => {
  if (!Number.isFinite(vinvinScore)) return 0;
  if (vinvinScore <= 0) return 0;
  return Math.min(1, vinvinScore / MAX_PARTNER_POINT_VALUE);
};

export const getPuntiLabel = (vinvinScore: number): "RELEVANT" | "TOP RATE" | "STARTER" => {
  if (vinvinScore >= 80) return "RELEVANT";
  if (vinvinScore >= 40) return "TOP RATE";
  return "STARTER";
};

// Temporary aliases while the platform transitions from "punti" to "VinVin score" naming
export const computeVinvinScoreFromCommission = computePuntiFromCommission;
export const computeVinvinScoreShare = computePuntiShare;
export const getVinvinScoreLabel = getPuntiLabel;

export const formatPuntiPercentage = (share: number): string => `${Math.round(share * 100)}%`;

// in constants/partner.ts
export const computeHostShareFromCommission = (commission: number): number => {
  const safe = Math.min(
    MAX_PARTNER_COMMISSION,
    Math.max(MIN_PARTNER_COMMISSION, commission),
  );
  return (100 - safe) / 100;
};
