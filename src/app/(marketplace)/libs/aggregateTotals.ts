export type AggregateEntry = {
  period: string;
  bookings: number;
  revenue: number;
};

type AggregateMap = Record<string, { bookings?: number; revenue?: number }>;

const clampNonNegative = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

const sanitizeMap = (raw: unknown): AggregateMap => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const map: AggregateMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const bookings = clampNonNegative(Number((value as any).bookings));
    const revenue = clampNonNegative(Number((value as any).revenue));
    map[key] = { bookings, revenue };
  }
  return map;
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