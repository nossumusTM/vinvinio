export type AggregateEntry = {
  period: string;
  bookings: number;
  revenue: number;
};

type AggregateMap = Record<string, { bookings?: number; revenue?: number }>;

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
    map[periodKey] = { bookings, revenue };
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

      return {
        period,
        bookings: clampNonNegative(bookingsNum),
        revenue: clampNonNegative(revenueNum),
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

const applyDelta = (map: AggregateMap, key: string, bookingsDelta: number, revenueDelta: number) => {
  const current = map[key] ?? { bookings: 0, revenue: 0 };
  const nextBookings = Math.max(0, (current.bookings ?? 0) + bookingsDelta);
  const nextRevenue = Math.max(0, (current.revenue ?? 0) + revenueDelta);
  map[key] = { bookings: nextBookings, revenue: nextRevenue };
  return map;
};

export const computeAggregateMaps = (
  rawDaily: unknown,
  rawMonthly: unknown,
  rawYearly: unknown,
  date: Date,
  bookingsDelta: number,
  revenueDelta: number,
) => {
  const { dayKey, monthKey, yearKey } = buildKeys(date);

  const dailyTotals = applyDelta(sanitizeMap(rawDaily), dayKey, bookingsDelta, revenueDelta);
  const monthlyTotals = applyDelta(sanitizeMap(rawMonthly), monthKey, bookingsDelta, revenueDelta);
  const yearlyTotals = applyDelta(sanitizeMap(rawYearly), yearKey, bookingsDelta, revenueDelta);

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
    .map(([period, value]) => ({
      period,
      bookings: clampNonNegative(Number(value.bookings ?? 0)),
      revenue: clampNonNegative(Number(value.revenue ?? 0)),
    }))
    .sort((a, b) => (a.period < b.period ? 1 : -1));
};

export const summarizeEntries = (entries: AggregateEntry[]) =>
  entries.reduce(
    (acc, entry) => ({
      bookings: acc.bookings + entry.bookings,
      revenue: acc.revenue + entry.revenue,
    }),
    { bookings: 0, revenue: 0 },
  );