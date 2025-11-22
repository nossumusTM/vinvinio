export const MAX_PARTNER_POINT_VALUE = 111;
export const MIN_PARTNER_COMMISSION = 15;
export const MAX_PARTNER_COMMISSION = 50;
export const PUNTI_PER_COMMISSION_STEP = 2;

export const sanitizePartnerCommission = (commission: number): number => {
  if (!Number.isFinite(commission)) {
    return MIN_PARTNER_COMMISSION;
  }

  const rounded = Math.round(commission);
  return Math.min(MAX_PARTNER_COMMISSION, Math.max(MIN_PARTNER_COMMISSION, rounded));
};

export const computePartnerCommission = (punti: number): number => {
  const normalized = Number.isFinite(punti) ? Math.max(0, Math.floor(punti)) : 0;
  const commissionBoost = Math.floor(normalized / PUNTI_PER_COMMISSION_STEP);
  const rawCommission = MIN_PARTNER_COMMISSION + commissionBoost;
  return Math.min(MAX_PARTNER_COMMISSION, rawCommission);
};

export const computePuntiFromCommission = (commission: number): number => {
  const sanitized = sanitizePartnerCommission(commission);
  const puntiFromCommission = (sanitized - MIN_PARTNER_COMMISSION) * PUNTI_PER_COMMISSION_STEP;

  return Math.min(MAX_PARTNER_POINT_VALUE, Math.max(0, puntiFromCommission));
};

export const computePuntiShare = (punti: number): number => {
  if (!Number.isFinite(punti)) return 0;
  if (punti <= 0) return 0;
  return Math.min(1, punti / MAX_PARTNER_POINT_VALUE);
};

export const getPuntiLabel = (punti: number): "Relevant" | "TOP RATE" | "PUMP" => {
  if (punti >= 80) return "Relevant";
  if (punti >= 40) return "TOP RATE";
  return "PUMP";
};

export const formatPuntiPercentage = (share: number): string => `${Math.round(share * 100)}%`;

export const computeHostShareFromCommission = (commission: number): number => {
  const sanitized = sanitizePartnerCommission(commission);
  const hostShare = 1 - sanitized / 100;
  return Number.isFinite(hostShare) ? Math.min(1, Math.max(0, hostShare)) : 0;
};
