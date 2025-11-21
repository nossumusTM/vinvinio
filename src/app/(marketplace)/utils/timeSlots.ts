export const DEFAULT_TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
] as const;

export type ListingAvailabilityRules = {
  defaultTimes?: string[];
  daysOfWeek?: Record<string, string[]>; // 0-6 (Sun-Sat)
  months?: Record<string, string[]>; // YYYY-MM
  years?: Record<string, string[]>; // YYYY
  specificDates?: Record<string, string[]>; // YYYY-MM-DD
};

export const normalizeTimeSlot = (time: string) => {
  const [h, m] = time.split(':').slice(0, 2);
  return `${String(h ?? '').padStart(2, '0')}:${String(m ?? '').padStart(2, '0') || '00'}`;
};

export const coerceTimeList = (times: unknown): string[] => {
  if (!Array.isArray(times)) return [];

  const seen = new Set<string>();
  const results: string[] = [];

  times.forEach((t) => {
    if (typeof t !== 'string') return;
    const normalized = normalizeTimeSlot(t);
    if (!/^[0-2]\d:[0-5]\d$/.test(normalized)) return;
    if (seen.has(normalized)) return;

    seen.add(normalized);
    results.push(normalized);
  });

  return results;
};

export const normalizeAvailabilityRules = (
  payload: unknown,
): ListingAvailabilityRules | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const rules = payload as ListingAvailabilityRules;

  const normalizeMap = (input: Record<string, unknown> | undefined) => {
    if (!input || typeof input !== 'object') return {} as Record<string, string[]>;
    return Object.entries(input).reduce<Record<string, string[]>>((acc, [key, value]) => {
      const normalizedList = coerceTimeList(value as string[]);
      if (normalizedList.length > 0) {
        acc[key] = normalizedList;
      }
      return acc;
    }, {});
  };

  const normalized: ListingAvailabilityRules = {
    defaultTimes: coerceTimeList(rules.defaultTimes) || undefined,
    daysOfWeek: normalizeMap(rules.daysOfWeek),
    months: normalizeMap(rules.months),
    years: normalizeMap(rules.years),
    specificDates: normalizeMap(rules.specificDates),
  };

  const hasAny =
    (normalized.defaultTimes && normalized.defaultTimes.length > 0) ||
    Object.keys(normalized.daysOfWeek ?? {}).length > 0 ||
    Object.keys(normalized.months ?? {}).length > 0 ||
    Object.keys(normalized.years ?? {}).length > 0 ||
    Object.keys(normalized.specificDates ?? {}).length > 0;

  return hasAny ? normalized : null;
};

export const formatTimeLabel = (time: string) => {
  const [hourStr, minuteStr] = normalizeTimeSlot(time).split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
};