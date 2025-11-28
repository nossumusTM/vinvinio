export type AggregateEntry = {
  period: string;
  bookings: number;
  revenue: number;
  commission?: number;
  qrScans?: number;
};

type AggregateMap = Record<
  string,
  {
    bookings?: number;
    revenue?: number;
    commissionSum?: number;
    commission?: number;
    qrScans?: number;
  }
>;

const clampNonNegative = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

const normalizePeriodKey = (key: string) => {
  const trimmed = String(key ?? '').trim();

  const dashDayMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dashDayMatch) {
    const [, y, m, d] = dashDayMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const slashDayMatch = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashDayMatch) {
    const [, y, m, d] = slashDayMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const dashMonthMatch = trimmed.match(/^(\d{4})-(\d{1,2})/);
  if (dashMonthMatch) {
    const [, y, m] = dashMonthMatch;
    return `${y}-${m.padStart(2, '0')}`;
  }

  const slashMonthMatch = trimmed.match(/^(\d{4})\/(\d{1,2})/);
  if (slashMonthMatch) {
    const [, y, m] = slashMonthMatch;
    return `${y}-${m.padStart(2, '0')}`;
  }

  const yearMatch = trimmed.match(/^(\d{4})/);
  if (yearMatch) {
    return yearMatch[1];
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return trimmed;
};

const sanitizeMap = (raw: unknown): AggregateMap => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const map: AggregateMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const periodKey = normalizePeriodKey(key);
    const bookings = clampNonNegative(Number((value as any).bookings));
    const revenue = clampNonNegative(Number((value as any).revenue));
    const qrScans = clampNonNegative(Number((value as any).qrScans));

    const commissionRaw =
      (value as any).commissionSum ?? (value as any).commission ?? undefined;
    const hasCommission = commissionRaw !== undefined && commissionRaw !== null;
    const commissionSum = hasCommission
      ? clampNonNegative(Number(commissionRaw))
      : undefined;

    map[periodKey] = hasCommission
      ? { bookings, revenue, commissionSum, qrScans }
      : { bookings, revenue, qrScans };
  }
  return map;
};

const normalizeArrayEntries = (raw: unknown[]): AggregateEntry[] => {
  return raw
    .map((entry) => {
      const id = (entry as any)?._id ?? {};
      const src = typeof id === 'object' && id !== null ? id : (entry as any);

      const y = src.year ?? src.y ?? src._year;
      const m = src.month ?? src.m ?? src._month;
      const d = src.day ?? src.d ?? src._day;

      let period: string | undefined;

      if (y != null && m != null && d != null) {
        period = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      } else if (y != null && m != null) {
        period = `${y}-${String(m).padStart(2, '0')}`;
      } else if (y != null) {
        period = String(y);
      } else {
        const rawPeriod =
          (entry as any)?.period ||
          (entry as any)?.date ||
          (entry as any)?.label ||
          (entry as any)?.day ||
          (id as any)?.period ||
          (id as any)?.date ||
          (id as any)?.label ||
          '';
        period = normalizePeriodKey(String(rawPeriod));
      }

      const bookingsNum = Number(
        (entry as any)?.bookings ??
          (entry as any)?.totalBooks ??
          (entry as any)?.books ??
          (entry as any)?.count ??
          (entry as any)?.totalCount,
      );

      const revenueNum = Number(
        (entry as any)?.revenue ??
          (entry as any)?.totalRevenue ??
          (entry as any)?.amount ??
          (entry as any)?.totalAmount ??
          (entry as any)?.grossRevenue,
      );

      const commissionValue = Number(
        (entry as any)?.commission ?? (entry as any)?.partnerCommission ?? (entry as any)?.commissionSum,
      );

      const qrScansNum = Number(
        (entry as any)?.qrScans ??
          (entry as any)?.totalQrScans ??
          (entry as any)?.scans,
      );

      return {
        period,
        bookings: clampNonNegative(bookingsNum),
        revenue: clampNonNegative(revenueNum),
        commission: Number.isFinite(commissionValue) ? clampNonNegative(commissionValue) : undefined,
        qrScans: Number.isFinite(qrScansNum) ? clampNonNegative(qrScansNum) : undefined,
      } satisfies AggregateEntry;
    })
    .filter((entry) => Boolean(entry.period));
};

const buildKeys = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return {
    dayKey: `${year}-${month}-${day}`,
    monthKey: `${year}-${month}`,
    yearKey: `${year}`,
  };
};

const applyDelta = (
  map: AggregateMap,
  key: string,
  bookingsDelta: number,
  revenueDelta: number,
  commissionDelta: number,
  qrDelta: number,
) => {
  const current = map[key] ?? { bookings: 0, revenue: 0, commissionSum: 0, qrScans: 0 };
  const nextBookings = Math.max(0, (current.bookings ?? 0) + bookingsDelta);
  const nextRevenue = Math.max(0, (current.revenue ?? 0) + revenueDelta);
  const nextQrScans = Math.max(0, (current.qrScans ?? 0) + qrDelta);

  const currentCommissionSum = clampNonNegative(
    Number(current.commissionSum ?? current.commission ?? 0),
  );
  const nextCommissionSum = Math.max(0, currentCommissionSum + commissionDelta);

  map[key] = {
      bookings: nextBookings,
      revenue: nextRevenue,
      commissionSum: nextCommissionSum,
      qrScans: nextQrScans,
    };
  return map;
};

export const computeAggregateMaps = (
  rawDaily: unknown,
  rawMonthly: unknown,
  rawYearly: unknown,
  date: Date,
  bookingsDelta: number,
  revenueDelta: number,
  commissionDelta = 0,
  qrDelta = 0,
) => {
  const normalizedDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

  const { dayKey, monthKey, yearKey } = buildKeys(normalizedDate);

  const dailyTotals = applyDelta(
    sanitizeMap(rawDaily),
    dayKey,
    bookingsDelta,
    revenueDelta,
    commissionDelta,
    qrDelta
  );
  const monthlyTotals = applyDelta(
    sanitizeMap(rawMonthly),
    monthKey,
    bookingsDelta,
    revenueDelta,
    commissionDelta,
    qrDelta
  );
  const yearlyTotals = applyDelta(
    sanitizeMap(rawYearly),
    yearKey,
    bookingsDelta,
    revenueDelta,
    commissionDelta,
    qrDelta
  );

  return { dailyTotals, monthlyTotals, yearlyTotals };
};

export const emptyAggregateMaps = () => ({
  dailyTotals: {},
  monthlyTotals: {},
  yearlyTotals: {},
});

export const mapToEntries = (raw: unknown): AggregateEntry[] => {

  if (Array.isArray(raw)) {
    return normalizeArrayEntries(raw).sort((a, b) => (a.period < b.period ? 1 : -1));
  }

  const map = sanitizeMap(raw);
  return Object.entries(map)
    .map(([period, value]) => {
      const bookings = clampNonNegative(Number(value.bookings ?? 0));
      const revenue = clampNonNegative(Number(value.revenue ?? 0));
      const hasCommission = value.commissionSum != null || value.commission != null;
      const commissionSum = hasCommission
        ? clampNonNegative(Number(value.commissionSum ?? value.commission ?? 0))
        : undefined;
      const commission =
        bookings > 0 && hasCommission && commissionSum != null
          ? commissionSum / bookings
          : undefined;

      const qrScans = clampNonNegative(Number((value as any)?.qrScans ?? 0));

      return {
        period,
        bookings,
        revenue,
        commission,
        qrScans
      } satisfies AggregateEntry;
    })
    .sort((a, b) => (a.period < b.period ? 1 : -1));
};

export const summarizeEntries = (entries: AggregateEntry[]) => {
  const totals = entries.reduce(
    (acc, entry) => ({
      bookings: acc.bookings + entry.bookings,
      revenue: acc.revenue + entry.revenue,
      commissionSum:
        acc.commissionSum +
        (Number.isFinite(entry.commission) ? (entry.commission as number) : 0) * entry.bookings,
      commissionCount:
        acc.commissionCount + (Number.isFinite(entry.commission) ? entry.bookings : 0),
    }),
    { bookings: 0, revenue: 0, commissionSum: 0, commissionCount: 0 },
  );

  const commission = totals.commissionCount > 0 ? totals.commissionSum / totals.commissionCount : undefined;

  return { ...totals, commission };
};